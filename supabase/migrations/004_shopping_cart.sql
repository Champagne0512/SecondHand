-- 购物车功能数据库迁移脚本
-- 创建购物车相关表结构、索引、函数和策略

-- ====================================================================
-- 第一步：创建购物车表
-- ====================================================================

CREATE TABLE IF NOT EXISTS shopping_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id) -- 确保同一用户同一商品只有一条记录
);

-- ====================================================================
-- 第二步：创建索引
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product_id ON shopping_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_created_at ON shopping_cart(created_at);

-- ====================================================================
-- 第三步：创建存储过程和函数
-- ====================================================================

-- 创建更新购物车商品数量的函数
CREATE OR REPLACE FUNCTION update_cart_item(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS UUID AS $$
DECLARE
  cart_item_id UUID;
BEGIN
  -- 检查商品是否存在且可购买
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND status = 'available') THEN
    RAISE EXCEPTION '商品不存在或已下架';
  END IF;
  
  -- 检查商品是否属于当前用户（不能购买自己的商品）
  IF EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND seller_id = p_user_id) THEN
    RAISE EXCEPTION '不能购买自己的商品';
  END IF;
  
  -- 更新或插入购物车记录
  INSERT INTO shopping_cart (user_id, product_id, quantity, updated_at)
  VALUES (p_user_id, p_product_id, p_quantity, TIMEZONE('utc'::text, NOW()))
  ON CONFLICT (user_id, product_id) 
  DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING id INTO cart_item_id;
  
  RETURN cart_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建删除购物车商品的函数
CREATE OR REPLACE FUNCTION remove_cart_item(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM shopping_cart 
  WHERE user_id = p_user_id AND product_id = p_product_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建清空用户购物车的函数
CREATE OR REPLACE FUNCTION clear_user_cart(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shopping_cart 
  WHERE user_id = p_user_id
  RETURNING count(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取用户购物车总金额的函数
CREATE OR REPLACE FUNCTION get_cart_total_amount(
  p_user_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_amount DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(p.price * sc.quantity), 0)
  INTO total_amount
  FROM shopping_cart sc
  JOIN products p ON sc.product_id = p.id
  WHERE sc.user_id = p_user_id
    AND p.status = 'available';
  
  RETURN total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取用户购物车商品数量的函数
CREATE OR REPLACE FUNCTION get_cart_item_count(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0)
  INTO item_count
  FROM shopping_cart
  WHERE user_id = p_user_id;
  
  RETURN item_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 第四步：创建触发器
-- ====================================================================

-- 为购物车表创建updated_at触发器
CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON shopping_cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 第五步：启用RLS（行级安全）
-- ====================================================================

ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 第六步：创建RLS策略
-- ====================================================================

-- 用户只能查看自己的购物车
CREATE POLICY "用户只能查看自己的购物车" ON shopping_cart
  FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 用户只能添加商品到自己的购物车
CREATE POLICY "用户只能添加商品到自己的购物车" ON shopping_cart
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 用户只能更新自己的购物车
CREATE POLICY "用户只能更新自己的购物车" ON shopping_cart
  FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 用户只能删除自己购物车中的商品
CREATE POLICY "用户只能删除自己购物车中的商品" ON shopping_cart
  FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ====================================================================
-- 第七步：创建视图（方便前端查询）
-- ====================================================================

-- 创建购物车详情视图，包含商品信息
CREATE OR REPLACE VIEW shopping_cart_details AS
SELECT 
  sc.id,
  sc.user_id,
  sc.product_id,
  sc.quantity,
  sc.created_at,
  sc.updated_at,
  p.title,
  p.description,
  p.price,
  p.original_price,
  p.category,
  p.images,
  p.condition,
  p.seller_id,
  p.status,
  p.location,
  p.contact_info,
  p.view_count,
  p.like_count,
  s.username as seller_username,
  s.avatar_url as seller_avatar,
  (p.price * sc.quantity) as subtotal
FROM shopping_cart sc
JOIN products p ON sc.product_id = p.id
JOIN profiles s ON p.seller_id = s.id
WHERE p.status = 'available';

-- ====================================================================
-- 第八步：插入测试数据
-- ====================================================================

-- 临时禁用RLS以便插入测试数据
ALTER TABLE shopping_cart DISABLE ROW LEVEL SECURITY;

-- 插入测试购物车数据
INSERT INTO shopping_cart (user_id, product_id, quantity, created_at, updated_at) VALUES
-- 张三（用户1）的购物车
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour'), -- 李四的iPad
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'd4e5f6a7-b8c9-0123-def0-456789012345', 1, NOW() - INTERVAL '2 hour', NOW() - INTERVAL '30 minute'), -- 王五的耳机
-- 李四（用户2）的购物车
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, NOW() - INTERVAL '3 hour', NOW() - INTERVAL '15 minute'), -- 张三的MacBook
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'b5c6d7e8-f9a0-1234-b567-890123456789', 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '5 minute'), -- 王五的自行车
-- 王五（用户3）的购物车
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 2, NOW() - INTERVAL '4 hour', NOW() - INTERVAL '10 minute'), -- 张三的AirPods（数量2）
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'c6d7e8f9-a0b1-2345-c678-901234567890', 1, NOW() - INTERVAL '2 hour', NOW() - INTERVAL '20 minute') -- 李四的电饭煲
ON CONFLICT (user_id, product_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  updated_at = NOW();

-- 重新启用RLS（确保数据安全）
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 第九步：创建购物车相关函数的安全策略
-- ====================================================================

-- 确保函数只能由认证用户调用
REVOKE EXECUTE ON FUNCTION update_cart_item(UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_cart_item(UUID, UUID, INTEGER) TO authenticated;

REVOKE EXECUTE ON FUNCTION remove_cart_item(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION remove_cart_item(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION clear_user_cart(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clear_user_cart(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION get_cart_total_amount(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_cart_total_amount(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION get_cart_item_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_cart_item_count(UUID) TO authenticated;

-- ====================================================================
-- 完成提示
-- ====================================================================

COMMENT ON TABLE shopping_cart IS '用户购物车表，存储用户添加的商品信息';
COMMENT ON COLUMN shopping_cart.quantity IS '商品数量，默认为1，必须大于0';
COMMENT ON VIEW shopping_cart_details IS '购物车详情视图，包含完整的商品和卖家信息';

-- 输出完成信息
DO $$ 
BEGIN
  RAISE NOTICE '购物车功能数据库迁移完成！';
  RAISE NOTICE '已创建：';
  RAISE NOTICE '  - 购物车表 (shopping_cart)';
  RAISE NOTICE '  - 5个购物车相关函数';
  RAISE NOTICE '  - 购物车详情视图 (shopping_cart_details)';
  RAISE NOTICE '  - RLS安全策略';
  RAISE NOTICE '  - 测试数据';
END $$;