-- 修复交易相关的RLS策略和数据完整性问题

-- 1. 检查并修复transactions表的RLS策略
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- 删除现有的RLS策略（如果存在）
DROP POLICY IF EXISTS "用户可以查看自己的交易" ON transactions;
DROP POLICY IF EXISTS "用户可以创建交易" ON transactions;
DROP POLICY IF EXISTS "用户可以更新自己的交易" ON transactions;

-- 创建新的RLS策略
CREATE POLICY "用户可以查看自己的交易" ON transactions
  FOR SELECT
  USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "用户可以创建交易" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "用户可以更新自己的交易" ON transactions
  FOR UPDATE
  USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- 2. 检查并修复profiles表的数据完整性
-- 创建函数来确保每个用户都有对应的profile
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果用户没有profile，创建一个基本的profile
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
    INSERT INTO profiles (id, username, avatar_url, created_at, updated_at)
    VALUES (
      auth.uid(),
      COALESCE(current_setting('app.current_username', true), '用户' || substr(auth.uid()::text, 1, 8)),
      'https://via.placeholder.com/150',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建触发器来确保用户profile存在
CREATE OR REPLACE TRIGGER trigger_ensure_user_profile
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();

-- 4. 修复外键约束问题
-- 确保外键约束允许NULL值，避免因为关联数据被删除而导致交易消失
ALTER TABLE transactions 
  ALTER COLUMN buyer_id DROP NOT NULL,
  ALTER COLUMN seller_id DROP NOT NULL,
  ALTER COLUMN product_id DROP NOT NULL;

-- 5. 添加数据验证约束
ALTER TABLE transactions 
  ADD CONSTRAINT check_transaction_amount CHECK (
    total_amount > 0 AND 
    product_price > 0 AND 
    quantity > 0
  );

-- 6. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 7. 修复订单号生成问题
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL OR NEW.order_no = '' OR NEW.order_no = '0' THEN
    -- 使用更可靠的订单号生成方式
    NEW.order_no := 'TXN' || 
                    TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISS') || 
                    LPAD(EXTRACT(MICROSECONDS FROM NOW() AT TIME ZONE 'UTC')::text, 6, '0') ||
                    LPAD(floor(random() * 1000)::int::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 创建交易状态历史记录表（如果还不存在）
CREATE TABLE IF NOT EXISTS transaction_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 创建状态变更触发器
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在状态实际改变时记录
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transaction_status_history (
      transaction_id, 
      old_status, 
      new_status, 
      notes,
      created_by,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.notes, '状态变更'),
      auth.uid(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_transaction_status
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_status_change();

-- 10. 添加调试信息函数
CREATE OR REPLACE FUNCTION debug_user_transactions(user_id UUID)
RETURNS TABLE (
  total_transactions BIGINT,
  buyer_transactions BIGINT,
  seller_transactions BIGINT,
  recent_transactions BIGINT,
  missing_buyer_profiles BIGINT,
  missing_seller_profiles BIGINT,
  missing_products BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE t.buyer_id = user_id) as buyer_transactions,
    COUNT(*) FILTER (WHERE t.seller_id = user_id) as seller_transactions,
    COUNT(*) FILTER (WHERE t.created_at > NOW() - INTERVAL '30 days') as recent_transactions,
    COUNT(*) FILTER (WHERE t.buyer_id = user_id AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = t.buyer_id)) as missing_buyer_profiles,
    COUNT(*) FILTER (WHERE t.seller_id = user_id AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = t.seller_id)) as missing_seller_profiles,
    COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = t.product_id)) as missing_products
  FROM transactions t
  WHERE t.buyer_id = user_id OR t.seller_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 修复已存在的空值数据
UPDATE transactions 
SET 
  buyer_id = NULL,
  seller_id = NULL,
  product_id = NULL
WHERE 
  buyer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = buyer_id)
  OR seller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = seller_id)
  OR product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE id = product_id);

-- 12. 添加数据完整性检查
CREATE OR REPLACE FUNCTION check_transaction_integrity()
RETURNS TABLE (
  transaction_id UUID,
  issue_type TEXT,
  issue_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- 检查缺失的买家profile
  SELECT t.id, 'missing_buyer_profile', '买家用户资料缺失'
  FROM transactions t
  WHERE t.buyer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = t.buyer_id)
  
  UNION ALL
  
  -- 检查缺失的卖家profile
  SELECT t.id, 'missing_seller_profile', '卖家用户资料缺失'
  FROM transactions t
  WHERE t.seller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = t.seller_id)
  
  UNION ALL
  
  -- 检查缺失的商品
  SELECT t.id, 'missing_product', '关联商品不存在'
  FROM transactions t
  WHERE t.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = t.product_id)
  
  UNION ALL
  
  -- 检查不合理的金额
  SELECT t.id, 'invalid_amount', '交易金额不合理'
  FROM transactions t
  WHERE t.total_amount <= 0 OR t.product_price <= 0 OR t.quantity <= 0
  
  UNION ALL
  
  -- 检查订单号格式
  SELECT t.id, 'invalid_order_no', '订单号格式异常'
  FROM transactions t
  WHERE t.order_no IS NULL OR t.order_no = '' OR LENGTH(t.order_no) < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;