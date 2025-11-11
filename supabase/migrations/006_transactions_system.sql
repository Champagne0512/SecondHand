-- 创建交易系统相关表
-- 执行时间: 2025-11-07
-- 描述: 为校园二手交易平台添加完整的交易系统功能

-- 1. 创建交易主表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- 商品信息快照（防止商品信息变更影响历史交易）
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  product_image TEXT,
  product_description TEXT,
  
  -- 交易数量和金额
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  
  -- 交易状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'paid', 'shipped', 'received', 'completed', 'cancelled', 'refunding', 'refunded')),
  
  -- 支付方式
  payment_method VARCHAR(20) 
    CHECK (payment_method IN ('cash', 'wechat', 'alipay', 'bank_transfer')),
  
  -- 交易备注和地址
  notes TEXT,
  shipping_address TEXT,
  contact_phone VARCHAR(20),
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 各阶段时间戳
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 2. 创建交易状态变更历史表
CREATE TABLE IF NOT EXISTS transaction_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建交易消息表（用于交易双方沟通）
CREATE TABLE IF NOT EXISTS transaction_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' 
    CHECK (message_type IN ('text', 'image', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 更新现有的transaction_reviews表，添加外键约束
-- 注意：如果transaction_reviews表已存在，这个操作会添加外键约束
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_reviews') THEN
    -- 添加外键约束（如果不存在）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_transaction_reviews_transaction_id'
    ) THEN
      ALTER TABLE transaction_reviews 
      ADD CONSTRAINT fk_transaction_reviews_transaction_id 
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_order_no ON transactions(order_no);

CREATE INDEX IF NOT EXISTS idx_transaction_status_history_transaction_id ON transaction_status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status_history_created_at ON transaction_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_transaction_messages_transaction_id ON transaction_messages(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_messages_sender_id ON transaction_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_transaction_messages_created_at ON transaction_messages(created_at);

-- 6. 创建RLS（行级安全策略）
-- 交易表策略
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己作为买家或卖家的交易
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  );

-- 用户只能创建自己作为买家的交易
CREATE POLICY "Users can create transactions as buyer" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 买家可以更新交易状态（付款、确认收货、取消）
CREATE POLICY "Buyers can update transaction status" ON transactions
  FOR UPDATE USING (
    auth.uid() = buyer_id AND
    status IN ('pending', 'paid', 'received', 'cancelled')
  );

-- 卖家可以更新交易状态（发货、完成）
CREATE POLICY "Sellers can update transaction status" ON transactions
  FOR UPDATE USING (
    auth.uid() = seller_id AND
    status IN ('paid', 'shipped', 'completed')
  );

-- 交易状态历史表策略
ALTER TABLE transaction_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history for their transactions" ON transaction_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE id = transaction_id 
      AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

-- 交易消息表策略
ALTER TABLE transaction_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their transactions" ON transaction_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE id = transaction_id 
      AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

CREATE POLICY "Users can create messages for their transactions" ON transaction_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE id = transaction_id 
      AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

-- 7. 创建触发器自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建生成订单号的函数
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL OR NEW.order_no = '' THEN
    NEW.order_no := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD(EXTRACT(MICROSECONDS FROM NOW())::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_transaction_order_no 
  BEFORE INSERT ON transactions 
  FOR EACH ROW EXECUTE FUNCTION generate_order_no();

-- 9. 创建交易状态变更的触发器（自动记录状态历史）
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果状态发生变化，记录到历史表
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transaction_status_history (
      transaction_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(auth.uid(), NEW.seller_id), -- 默认为卖家操作
      CASE 
        WHEN NEW.status = 'cancelled' THEN '交易取消'
        WHEN NEW.status = 'paid' THEN '付款完成'
        WHEN NEW.status = 'shipped' THEN '已发货'
        WHEN NEW.status = 'received' THEN '已收货'
        WHEN NEW.status = 'completed' THEN '交易完成'
        WHEN NEW.status = 'refunding' THEN '申请退款'
        WHEN NEW.status = 'refunded' THEN '退款完成'
        ELSE '状态变更'
      END
    );
  END IF;
  
  -- 自动设置时间戳
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.paid_at = NOW();
  ELSIF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = NOW();
  ELSIF NEW.status = 'received' AND OLD.status != 'received' THEN
    NEW.received_at = NOW();
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_transaction_status_change_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_transaction_status_change();

-- 10. 创建有用的视图
-- 交易详情视图（包含关联信息）
CREATE OR REPLACE VIEW transaction_details AS
SELECT 
  t.*,
  buyer.username as buyer_username,
  buyer.avatar_url as buyer_avatar,
  seller.username as seller_username,
  seller.avatar_url as seller_avatar,
  p.images as product_images,
  p.category as product_category,
  p.condition as product_condition
FROM transactions t
LEFT JOIN profiles buyer ON t.buyer_id = buyer.id
LEFT JOIN profiles seller ON t.seller_id = seller.id
LEFT JOIN products p ON t.product_id = p.id;

-- 用户交易统计视图
CREATE OR REPLACE VIEW user_transaction_stats AS
SELECT 
  user_id,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_transactions,
  COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_sales_amount,
  COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_transaction_amount
FROM (
  SELECT buyer_id as user_id, status, total_amount FROM transactions
  UNION ALL
  SELECT seller_id as user_id, status, total_amount FROM transactions
) all_transactions
GROUP BY user_id;

-- 11. 创建一些有用的函数
-- 获取用户的待处理交易数量
CREATE OR REPLACE FUNCTION get_pending_transaction_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM transactions
  WHERE (buyer_id = user_uuid OR seller_id = user_uuid)
  AND status IN ('pending', 'paid', 'shipped');
  
  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建交易（从购物车）
CREATE OR REPLACE FUNCTION create_transaction_from_cart(
  cart_user_id UUID,
  cart_product_ids UUID[]
)
RETURNS TABLE (
  success BOOLEAN,
  transaction_id UUID,
  message TEXT
) AS $$
DECLARE
  cart_item RECORD;
  new_transaction_id UUID;
  product_seller_id UUID;
BEGIN
  -- 验证购物车商品都属于当前用户
  IF NOT EXISTS (
    SELECT 1 FROM shopping_cart 
    WHERE user_id = cart_user_id 
    AND product_id = ANY(cart_product_ids)
    HAVING COUNT(*) = array_length(cart_product_ids, 1)
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, '购物车商品验证失败'::TEXT;
    RETURN;
  END IF;
  
  -- 逐个创建交易
  FOR cart_item IN 
    SELECT sc.*, p.user_id as seller_id, p.name, p.price, p.image, p.description
    FROM shopping_cart sc
    JOIN products p ON sc.product_id = p.id
    WHERE sc.user_id = cart_user_id
    AND sc.product_id = ANY(cart_product_ids)
  LOOP
    -- 检查商品是否还存在且可用
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = cart_item.product_id 
      AND status = 'available'
    ) THEN
      RETURN QUERY SELECT false, NULL::UUID, 
        '商品 ' || cart_item.product_name || ' 不可用'::TEXT;
      RETURN;
    END IF;
    
    -- 创建交易记录
    INSERT INTO transactions (
      buyer_id,
      seller_id,
      product_id,
      product_name,
      product_price,
      product_image,
      product_description,
      quantity,
      total_amount
    ) VALUES (
      cart_user_id,
      cart_item.seller_id,
      cart_item.product_id,
      cart_item.name,
      cart_item.price,
      cart_item.image,
      cart_item.description,
      cart_item.quantity,
      cart_item.price * cart_item.quantity
    ) RETURNING id INTO new_transaction_id;
    
    -- 从购物车移除已下单商品
    DELETE FROM shopping_cart 
    WHERE user_id = cart_user_id 
    AND product_id = cart_item.product_id;
    
    -- 更新商品状态为已售（或减少库存）
    UPDATE products 
    SET status = 'sold',
      updated_at = NOW()
    WHERE id = cart_item.product_id;
    
    RETURN QUERY SELECT true, new_transaction_id, 
      '交易创建成功'::TEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 插入一些示例数据（可选，用于测试）
-- 注意：在实际生产环境中应该删除这部分
DO $$
DECLARE
  sample_buyer UUID;
  sample_seller UUID;
  sample_product UUID;
BEGIN
  -- 获取示例用户和商品（如果存在）
  SELECT id INTO sample_buyer FROM profiles LIMIT 1;
  SELECT id INTO sample_seller FROM profiles LIMIT 1 OFFSET 1;
  SELECT id INTO sample_product FROM products WHERE status = 'available' LIMIT 1;
  
  IF sample_buyer IS NOT NULL AND sample_seller IS NOT NULL AND sample_product IS NOT NULL THEN
    -- 插入示例交易
    INSERT INTO transactions (
      buyer_id,
      seller_id,
      product_id,
      product_name,
      product_price,
      quantity,
      total_amount,
      status,
      payment_method
    ) VALUES (
      sample_buyer,
      sample_seller,
      sample_product,
      '示例商品',
      99.99,
      1,
      99.99,
      'pending',
      'wechat'
    );
  END IF;
END $$;

-- 添加注释
COMMENT ON TABLE transactions IS '交易主表，记录所有交易信息';
COMMENT ON TABLE transaction_status_history IS '交易状态变更历史记录';
COMMENT ON TABLE transaction_messages IS '交易双方沟通消息';
COMMENT ON COLUMN transactions.order_no IS '订单号，格式：TXN+时间戳+微秒';
COMMENT ON COLUMN transactions.status IS '交易状态：pending(待付款), paid(已付款), shipped(已发货), received(已收货), completed(已完成), cancelled(已取消), refunding(退款中), refunded(已退款)';
COMMENT ON COLUMN transactions.payment_method IS '支付方式：cash(现金), wechat(微信), alipay(支付宝), bank_transfer(银行转账)';