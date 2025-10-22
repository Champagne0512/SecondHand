-- 完整数据库初始化脚本（修复外键约束问题）
-- 这个脚本将创建一个完整的校园二手交易平台数据库，profiles表不再依赖auth.users

-- ====================================================================
-- 第一步：创建所有表结构
-- ====================================================================

-- 1. 创建用户profiles表（独立存在，不依赖auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 创建商品表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  condition TEXT NOT NULL CHECK (condition IN ('全新', '几乎全新', '轻微使用', '明显使用')),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
  location TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0
);

-- 3. 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- 4. 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 第二步：创建索引
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ====================================================================
-- 第三步：创建存储过程和函数
-- ====================================================================

-- 创建更新updated_at字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建updated_at触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 增加商品收藏数的存储过程
CREATE OR REPLACE FUNCTION increment_like_count(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET like_count = COALESCE(like_count, 0) + 1 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 减少商品收藏数的存储过程
CREATE OR REPLACE FUNCTION decrement_like_count(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 第四步：启用RLS（行级安全）
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 第五步：创建RLS策略（简化版本，基于email匹配）
-- ====================================================================

-- profiles表策略
CREATE POLICY "用户可以查看所有profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "认证用户可以创建profile" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以更新profile" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以删除profile" ON profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- products表策略
CREATE POLICY "任何人都可以查看商品" ON products
  FOR SELECT USING (true);

CREATE POLICY "认证用户可以创建商品" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以更新商品" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以删除商品" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- favorites表策略
CREATE POLICY "认证用户可以查看收藏" ON favorites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以创建收藏" ON favorites
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以删除收藏" ON favorites
  FOR DELETE USING (auth.role() = 'authenticated');

-- conversations表策略
CREATE POLICY "认证用户可以查看对话" ON conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以创建对话" ON conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以更新对话" ON conversations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- messages表策略
CREATE POLICY "认证用户可以查看消息" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "认证用户可以发送消息" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ====================================================================
-- 第六步：创建用户注册时的自动触发器（简化版本）
-- ====================================================================

-- 创建自动创建profile的触发器函数（简化版，不依赖auth.users）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果profiles表中不存在该email的用户，则创建
  INSERT INTO public.profiles (id, username, email, avatar_url, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', '用户' || substr(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 第七步：插入测试数据（使用你提供的3个实际用户ID）
-- ====================================================================

-- 临时禁用RLS以便插入测试数据
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 插入测试用户数据（使用你创建的3个真实UUID和邮箱）
INSERT INTO profiles (id, username, email, avatar_url, phone, created_at, updated_at) VALUES
-- 张三（对应test1@qq.com）
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '张三', 'test1@qq.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', '13800138001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
-- 李四（对应test2@qq.com）
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', '李四', 'test2@qq.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', '13800138002', NOW() - INTERVAL '25 day', NOW() - INTERVAL '2 day'),
-- 王五（对应test3@qq.com）
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '王五', 'test3@qq.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', '13800138003', NOW() - INTERVAL '20 day', NOW() - INTERVAL '3 day')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- 插入商品数据（seller_id均为你创建的3个用户ID）
INSERT INTO products (id, title, description, price, original_price, category, images, condition, seller_id, status, location, contact_info, created_at, updated_at, view_count, like_count) VALUES
-- 电子产品类（卖家：张三）
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MacBook Pro 2020 M1芯片', '13寸 M1芯片，8GB内存，256GB SSD，几乎全新，保护完好。', 6500.00, 9999.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'], '几乎全新', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'available', '计算机学院', '微信: zhangsan123', NOW() - INTERVAL '5 day', NOW() - INTERVAL '1 day', 156, 23),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'AirPods Pro 2代', '主动降噪，空间音频，充电盒支持MagSafe充电。', 1200.00, 1999.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1606234221515-2d6e0c8b7695?w=400&h=300&fit=crop'], '几乎全新', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'available', '计算机学院', '微信: zhangsan123', NOW() - INTERVAL '12 hour', NOW() - INTERVAL '2 hour', 98, 15),

-- 电子产品类（卖家：李四）
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'iPad mini 6 64GB', '紫色WiFi版，8.3英寸屏幕，A15芯片。', 3200.00, 3799.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'], '轻微使用', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'available', '设计学院', '电话: 13800138002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hour', 76, 9),

-- 电子产品类（卖家：王五）
('d4e5f6a7-b8c9-0123-def0-456789012345', 'Sony WH-1000XM4 降噪耳机', '黑色，主动降噪，30小时续航。', 1500.00, 2499.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'], '几乎全新', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'available', '音乐学院', 'QQ: 123456789', NOW() - INTERVAL '2 day', NOW() - INTERVAL '4 hour', 54, 8),

-- 图书教材类（卖家：李四）
('f6a7b8c9-d0e1-2345-f123-678901234567', '考研数学复习资料全套', '包含高等数学、线性代数、概率论全套教材。', 50.00, 120.00, 'books', ARRAY['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=300&fit=crop'], '轻微使用', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'available', '数学学院', '电话: 13800138002', NOW() - INTERVAL '4 day', NOW() - INTERVAL '2 day', 89, 12),
('c9d0e1f2-e3d4-5678-c456-901234567890', '《深入理解计算机系统》', 'CSAPP经典教材，英文原版。', 60.00, 128.00, 'books', ARRAY['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop'], '全新', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'available', '计算机学院', '电话: 13800138002', NOW() - INTERVAL '2 day', NOW() - INTERVAL '5 hour', 28, 5),

-- 图书教材类（卖家：王五）
('a7b8c9d0-e1f2-3456-a234-789012345678', '《算法导论》第三版', '计算机经典教材，中文版，保存完好。', 45.00, 88.00, 'books', ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop'], '轻微使用', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'available', '计算机学院', '电话: 13800138003', NOW() - INTERVAL '6 hour', NOW() - INTERVAL '1 hour', 34, 4),
('d0e1f2d3-e4f5-6789-d567-012345678901', 'CPA会计全套教材', '2023年CPA会计教材，包含教材+习题+真题解析。', 80.00, 180.00, 'books', ARRAY['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'], '轻微使用', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'available', '商学院', 'QQ: 123456789', NOW() - INTERVAL '4 hour', NOW() - INTERVAL '1 hour', 19, 2),

-- 运动器材类（卖家：张三）
('a4b5c6d7-e8f9-0123-a456-789012345678', '篮球+护具套装', '斯伯丁篮球7号，包含护膝、护腕、运动水壶。', 80.00, 150.00, 'sports', ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'], '明显使用', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'available', '体育学院', '微信: zhangsan123', NOW() - INTERVAL '2 day', NOW() - INTERVAL '5 hour', 31, 6),

-- 运动器材类（卖家：王五）
('b5c6d7e8-f9a0-1234-b567-890123456789', '26寸山地自行车', '7速变速，车况良好，刹车灵敏。', 200.00, 350.00, 'sports', ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop'], '明显使用', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'available', '体育学院', 'QQ: 123456789', NOW() - INTERVAL '3 day', NOW() - INTERVAL '1 day', 234, 45),

-- 生活用品类（卖家：李四）
('c6d7e8f9-a0b1-2345-c678-901234567890', '小米电饭煲 3L', '智能电饭煲，24小时预约，多种烹饪模式。', 120.00, 199.00, 'daily', ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'], '几乎全新', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'available', '学生宿舍', '电话: 13800138002', NOW() - INTERVAL '5 hour', NOW() - INTERVAL '1 hour', 18, 2),

-- 服装鞋帽类（卖家：张三）
('d7e8f9a0-b1c2-3456-d789-012345678901', 'Nike运动鞋 42码', 'Air Max系列，黑白配色，鞋底磨损轻微。', 280.00, 599.00, 'clothing', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'], '轻微使用', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'available', '生活区', '微信: zhangsan123', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hour', 42, 8)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  category = EXCLUDED.category,
  images = EXCLUDED.images,
  condition = EXCLUDED.condition,
  seller_id = EXCLUDED.seller_id,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  contact_info = EXCLUDED.contact_info,
  updated_at = NOW(),
  view_count = EXCLUDED.view_count,
  like_count = EXCLUDED.like_count;

-- 插入收藏数据（user_id为你创建的用户ID，关联上述商品）
INSERT INTO favorites (user_id, product_id, created_at) VALUES
-- 张三收藏了李四和王五的商品
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'c3d4e5f6-a7b8-9012-cdef-345678901234', NOW() - INTERVAL '1 day'),
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'd4e5f6a7-b8c9-0123-def0-456789012345', NOW() - INTERVAL '2 hour'),
-- 李四收藏了张三和王五的商品
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '3 hour'),
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'b5c6d7e8-f9a0-1234-b567-890123456789', NOW() - INTERVAL '5 hour'),
-- 王五收藏了张三和李四的商品
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', NOW() - INTERVAL '1 hour'),
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'c6d7e8f9-a0b1-2345-c678-901234567890', NOW() - INTERVAL '4 hour')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- 插入对话数据（buyer_id和seller_id均为你创建的用户ID）
INSERT INTO conversations (product_id, buyer_id, seller_id, last_message, last_message_at) VALUES
-- 李四（买家）咨询张三的MacBook
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '最低能多少出？', NOW() - INTERVAL '30 minute'),
-- 王五（买家）咨询李四的iPad
('c3d4e5f6-a7b8-9012-cdef-345678901234', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '能刀吗？', NOW() - INTERVAL '15 minute'),
-- 张三（买家）咨询王五的耳机
('d4e5f6a7-b8c9-0123-def0-456789012345', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '是正品吗？', NOW() - INTERVAL '5 minute')
ON CONFLICT DO NOTHING;

-- 插入消息数据（sender_id为你创建的用户ID，关联上述对话）
INSERT INTO messages (conversation_id, sender_id, content, is_read) VALUES
-- 第一个对话（李四-张三）的消息
((SELECT id FROM conversations WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '你好，这个MacBook还在吗？', true),
((SELECT id FROM conversations WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '在的，诚心要可以聊', true),
((SELECT id FROM conversations WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '最低能多少出？', false),
-- 第二个对话（王五-李四）的消息
((SELECT id FROM conversations WHERE product_id = 'c3d4e5f6-a7b8-9012-cdef-345678901234'), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'iPad还在吗？', true),
((SELECT id FROM conversations WHERE product_id = 'c3d4e5f6-a7b8-9012-cdef-345678901234'), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '在的，几乎全新', true),
((SELECT id FROM conversations WHERE product_id = 'c3d4e5f6-a7b8-9012-cdef-345678901234'), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '能刀吗？', false),
-- 第三个对话（张三-王五）的消息
((SELECT id FROM conversations WHERE product_id = 'd4e5f6a7-b8c9-0123-def0-456789012345'), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '耳机是正品吗？', true),
((SELECT id FROM conversations WHERE product_id = 'd4e5f6a7-b8c9-0123-def0-456789012345'), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '是的，官网购入有记录', true),
((SELECT id FROM conversations WHERE product_id = 'd4e5f6a7-b8c9-0123-def0-456789012345'), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '好的，我考虑下', false)
ON CONFLICT DO NOTHING;

-- 重新启用RLS（确保数据安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;