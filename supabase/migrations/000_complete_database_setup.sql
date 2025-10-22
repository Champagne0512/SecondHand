-- 完整数据库初始化脚本
-- 这个脚本将创建一个完整的校园二手交易平台数据库，包含所有表、约束、策略和测试数据

-- ====================================================================
-- 第一步：创建所有表结构
-- ====================================================================

-- 1. 创建用户profiles表（不依赖auth.users，独立存在）
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
-- 第五步：创建RLS策略
-- ====================================================================

-- profiles表策略
CREATE POLICY "用户可以查看所有profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "用户只能更新自己的profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能删除自己的profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- products表策略
CREATE POLICY "任何人都可以查看商品" ON products
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的商品" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "用户只能更新自己的商品" ON products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "用户只能删除自己的商品" ON products
  FOR DELETE USING (auth.uid() = seller_id);

-- favorites表策略
CREATE POLICY "用户只能查看自己的收藏" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的收藏" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的收藏" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- conversations表策略
CREATE POLICY "用户只能查看自己的对话" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "用户只能创建自己的对话" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "用户只能更新自己的对话" ON conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- messages表策略
CREATE POLICY "用户只能查看自己对话中的消息" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "用户只能发送消息到自己的对话" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- ====================================================================
-- 第六步：创建用户注册时的自动触发器
-- ====================================================================

-- 创建自动创建profile的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', '用户' || substr(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 第七步：插入测试数据
-- ====================================================================

-- 临时禁用RLS以便插入测试数据
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 插入测试用户数据
INSERT INTO profiles (id, username, email, avatar_url, phone, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', '张三', 'zhangsan@example.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', '13800138001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', '李四', 'lisi@example.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', '13800138002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', '王五', 'wangwu@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', '13800138003', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
('44444444-4444-4444-4444-444444444444', '赵六', 'zhaoliu@example.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', '13800138004', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
('55555555-5555-5555-5555-555555555555', '钱七', 'qianqi@example.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', '13800138005', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- 插入商品数据
INSERT INTO products (id, title, description, price, original_price, category, images, condition, seller_id, status, location, contact_info, created_at, updated_at, view_count, like_count) VALUES
-- 电子产品类
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MacBook Pro 2020 M1芯片', '13寸 M1芯片，8GB内存，256GB SSD，几乎全新，保护完好，原装充电器，箱说齐全。适合编程、设计、学习使用。', 6500.00, 9999.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop'], '几乎全新', '11111111-1111-1111-1111-111111111111', 'available', '计算机学院', '微信: zhangsan123', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 156, 23),

('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'AirPods Pro 2代', '主动降噪，空间音频，充电盒支持MagSafe充电，几乎全新，包装盒配件齐全。', 1200.00, 1999.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1606234221515-2d6e0c8b7695?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&h=300&fit=crop'], '几乎全新', '11111111-1111-1111-1111-111111111111', 'available', '计算机学院', '微信: zhangsan123', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '2 hours', 98, 15),

('c3d4e5f6-g7h8-9012-cdef-345678901234', 'iPad mini 6 64GB', '紫色WiFi版，8.3英寸屏幕，A15芯片，支持第二代Apple Pencil。屏幕贴膜，带保护壳。', 3200.00, 3799.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=400&h=300&fit=crop'], '轻微使用', '22222222-2222-2222-2222-222222222222', 'available', '设计学院', '电话: 13800138002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours', 76, 9),

('d4e5f6g7-h8i9-0123-defg-456789012345', 'Sony WH-1000XM4 降噪耳机', '黑色，主动降噪，30小时续航，支持快充。原装包装盒，配件齐全。', 1500.00, 2499.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop'], '几乎全新', '33333333-3333-3333-3333-333333333333', 'available', '音乐学院', 'QQ: 123456789', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours', 54, 8),

('e5f6g7h8-i9j0-1234-efgh-567890123456', 'Nintendo Switch OLED版', '白色，续航增强，64GB存储，包含《塞尔达传说》卡带。手柄无漂移，屏幕完美。', 2200.00, 2599.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1606294836355-3210889c31a7?w=400&h=300&fit=crop'], '轻微使用', '44444444-4444-4444-4444-444444444444', 'available', '游戏设计学院', '微信: zhaoliu456', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 143, 27),

-- 图书教材类
('f6g7h8i9-j0k1-2345-fghi-678901234567', '考研数学复习资料全套', '包含高等数学、线性代数、概率论全套教材，习题集，历年真题解析。资料完整，有少量笔记，适合考研复习使用。', 50.00, 120.00, 'books', ARRAY['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'], '轻微使用', '22222222-2222-2222-2222-222222222222', 'available', '数学学院', '电话: 13800138002', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', 89, 12),

('g7h8i9j0-k1l2-3456-ghij-789012345678', '《算法导论》第三版', '计算机经典教材，中文版，保存完好，无笔记涂写。适合算法学习和面试准备。', 45.00, 88.00, 'books', ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop'], '轻微使用', '55555555-5555-5555-5555-555555555555', 'available', '计算机学院', '电话: 13800138005', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour', 34, 4),

('h8i9j0k1-l2m3-4567-hijk-890123456789', '考研英语词汇红宝书', '新东方红宝书，包含必考词汇+超纲词汇，有少量笔记，重点词汇已标记。', 20.00, 39.00, 'books', ARRAY['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=300&fit=crop'], '明显使用', '11111111-1111-1111-1111-111111111111', 'available', '外国语学院', '微信: zhangsan123', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours', 67, 11),

('i9j0k1l2-m3n4-5678-ijkl-901234567890', '《深入理解计算机系统》', 'CSAPP经典教材，英文原版，保存完好。适合深入学习计算机系统原理。', 60.00, 128.00, 'books', ARRAY['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop'], '全新', '22222222-2222-2222-2222-222222222222', 'available', '计算机学院', '电话: 13800138002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 hours', 28, 5),

('j0k1l2m3-n4o5-6789-jklm-012345678901', 'CPA会计全套教材', '2023年CPA会计教材，包含教材+习题+真题解析，适合CPA考试准备。', 80.00, 180.00, 'books', ARRAY['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'], '轻微使用', '33333333-3333-3333-3333-333333333333', 'available', '商学院', 'QQ: 123456789', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 19, 2),

-- 运动器材类
('k1l2m3n4-o5p6-7890-klmn-123456789012', '26寸山地自行车', '7速变速，车况良好，刹车灵敏，轮胎磨损正常。适合校园骑行，送车锁和打气筒。', 200.00, 350.00, 'sports', ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop'], '明显使用', '33333333-3333-3333-3333-333333333333', 'available', '体育学院', 'QQ: 123456789', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 234, 45),

('l2m3n4o5-p6q7-8901-lmno-234567890123', '哑铃套装 20kg', '可调节重量，包含连接杆，防滑握把，适合宿舍健身。送哑铃架和健身手套。', 120.00, 220.00, 'sports', ARRAY['https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'], '几乎全新', '44444444-4444-4444-4444-444444444444', 'available', '体育学院', '微信: zhaoliu456', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 45, 7),

('m3n4o5p6-q7r8-9012-mnop-345678901234', '羽毛球拍套装', '尤尼克斯品牌，两支球拍+羽毛球+球包，拍子无破损，线张紧度适中。', 150.00, 280.00, 'sports', ARRAY['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop'], '轻微使用', '55555555-5555-5555-5555-555555555555', 'available', '体育学院', '电话: 13800138005', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 hours', 23, 3),

('n4o5p6q7-r8s9-0123-nopq-456789012345', '篮球+护具套装', '斯伯丁篮球7号，包含护膝、护腕、运动水壶。篮球气压适中，护具尺寸均码。', 80.00, 150.00, 'sports', ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop'], '明显使用', '11111111-1111-1111-1111-111111111111', 'available', '体育学院', '微信: zhangsan123', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 hours', 31, 6),

-- 生活用品类
('o5p6q7r8-s9t0-1234-opqr-567890123456', '小米电饭煲 3L', '智能电饭煲，24小时预约，多种烹饪模式，内胆无划痕，配件齐全。', 120.00, 199.00, 'daily', ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'], '几乎全新', '22222222-2222-2222-2222-222222222222', 'available', '学生宿舍', '电话: 13800138002', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour', 18, 2),

('p6q7r8s9-t0u1-2345-pqrs-678901234567', '台灯+书架组合', 'LED护眼台灯，三档调光，附带小型书架，适合学习使用。', 45.00, 89.00, 'daily', ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'], '轻微使用', '33333333-3333-3333-3333-333333333333', 'available', '学生宿舍', 'QQ: 123456789', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 27, 4),

('q7r8s9t0-u1v2-3456-rstu-789012345678', '收纳箱套装 3个装', '大中小三个尺寸，带盖设计，可堆叠，适合宿舍收纳使用。', 35.00, 65.00, 'daily', ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'], '全新', '44444444-4444-4444-4444-444444444444', 'available', '学生宿舍', '微信: zhaoliu456', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours', 12, 1),

-- 服装鞋帽类
('r8s9t0u1-v2w3-4567-stuv-890123456789', 'Nike运动鞋 42码', 'Air Max系列，黑白配色，鞋底磨损轻微，鞋面清洁，适合运动或日常穿着。', 280.00, 599.00, 'clothing', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop'], '轻微使用', '55555555-5555-5555-5555-555555555555', 'available', '体育学院', '电话: 13800138005', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 hours', 56, 9),

('s9t0u1v2-w3x4-5678-tuvw-901234567890', '羽绒服 M码', '黑色长款羽绒服，90%白鸭绒，保暖效果好，仅穿过几次，清洁保存。', 180.00, 450.00, 'clothing', ARRAY['https://images.unsplash.com/photo-1544966503-7e3c4c5c5c5c?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'], '几乎全新', '11111111-1111-1111-1111-111111111111', 'available', '学生宿舍', '微信: zhangsan123', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', 38, 6),

-- 其他类别
('t0u1v2w3-x4y5-6789-uvwx-012345678901', '电动牙刷+刷头套装', '飞利浦声波电动牙刷，包含5个替换刷头，充电座，旅行盒。', 150.00, 299.00, 'other', ARRAY['https://images.unsplash.com/photo-1606857521015-7f9fcf417739?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=300&fit=crop'], '几乎全新', '22222222-2222-2222-2222-222222222222', 'available', '学生宿舍', '电话: 13800138002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 29, 4),

('u1v2w3x4-y5z6-7890-vwxy-123456789012', '吉他入门套装', '民谣吉他41寸，含调音器、拨片、背带、入门教材。音准良好，适合初学者。', 220.00, 380.00, 'other', ARRAY['https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop'], '轻微使用', '33333333-3333-3333-3333-333333333333', 'available', '艺术学院', 'QQ: 123456789', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 41, 7),

-- 已售出的商品
('v2w3x4y5-z6a7-8901-wxyz-234567890123', 'iPhone 13 Pro 256GB', '国行版本，石墨色，电池健康度95%，无拆无修，屏幕完美。包含原装充电器和数据线。', 4500.00, 7999.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=300&fit=crop'], '几乎全新', '44444444-4444-4444-4444-444444444444', 'sold', '信息学院', '微信: zhaoliu456', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', 189, 34),

('w3x4y5z6-a7b8-9012-xyza-345678901234', 'iPad Air 4 64GB', '深空灰色，WiFi版，屏幕完美，电池健康度98%。包含原装充电器。', 2800.00, 4399.00, 'electronics', ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=400&h=300&fit=crop'], '几乎全新', '11111111-1111-1111-1111-111111111111', 'sold', '计算机学院', '微信: zhangsan123', NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days', 134, 21)
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

-- 插入收藏数据
INSERT INTO favorites (id, user_id, product_id, created_at) VALUES
('x4y5z6a7-b8c9-0123-yzab-456789012345', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '2 days'),
('y5z6a7b8-c9d0-1234-zabc-567890123456', '33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '1 day'),
('z6a7b8c9-d0e1-2345-abcd-678901234567', '44444444-4444-4444-4444-444444444444', 'f6g7h8i9-j0k1-2345-fghi-678901234567', NOW() - INTERVAL '3 days'),
('a7b8c9d0-e1f2-3456-bcde-789012345678', '55555555-5555-5555-5555-555555555555', 'k1l2m3n4-o5p6-7890-klmn-123456789012', NOW() - INTERVAL '1 day'),
('b8c9d0e1-f2g3-4567-cdef-890123456789', '11111111-1111-1111-1111-111111111111', 'd4e5f6g7-h8i9-0123-defg-456789012345', NOW() - INTERVAL '4 hours'),
('c9d0e1f2-g3h4-5678-defg-901234567890', '22222222-2222-2222-2222-222222222222', 'r8s9t0u1-v2w3-4567-stuv-890123456789', NOW() - INTERVAL '2 days'),
('d0e1f2g3-h4i5-6789-efgh-012345678901', '33333333-3333-3333-3333-333333333333', 'u1v2w3x4-y5z6-7890-vwxy-123456789012', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  product_id = EXCLUDED.product_id;

-- 插入对话数据
INSERT INTO conversations (id, product_id, buyer_id, seller_id, last_message, last_message_at, created_at, updated_at) VALUES
('e1f2g3h4-i5j6-7890-fghi-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '你好，这个MacBook还能便宜点吗？', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

('f2g3h4i5-j6k7-8901-ghij-234567890123', 'f6g7h8i9-j0k1-2345-fghi-678901234567', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '资料是完整的吗？包含答案解析吗？', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours'),

('g3h4i5j6-k7l8-9012-hijk-345678901234', 'k1l2m3n4-o5p6-7890-klmn-123456789012', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '自行车可以试骑吗？', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours'),

('h4i5j6k7-l8m9-0123-ijkl-456789012345', 'd4e5f6g7-h8i9-0123-defg-456789012345', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'AirPods还在吗？', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours'),

('i5j6k7l8-m9n0-1234-jklm-567890123456', 'r8s9t0u1-v2w3-4567-stuv-890123456789', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '42码合适吗？', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  buyer_id = EXCLUDED.buyer_id,
  seller_id = EXCLUDED.seller_id,
  last_message = EXCLUDED.last_message,
  last_message_at = EXCLUDED.last_message_at,
  updated_at = NOW();

-- 插入消息数据
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES
-- 对话1的消息
('j6k7l8m9-n0o1-2345-klmn-678901234567', 'e1f2g3h4-i5j6-7890-fghi-123456789012', '22222222-2222-2222-2222-222222222222', '你好，我对你的MacBook感兴趣', true, NOW() - INTERVAL '2 days'),
('k7l8m9n0-o1p2-3456-lmno-789012345678', 'e1f2g3h4-i5j6-7890-fghi-123456789012', '11111111-1111-1111-1111-111111111111', '你好，电脑还在的，功能一切正常', true, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
('l8m9n0o1-p2q3-4567-mnop-890123456789', 'e1f2g3h4-i5j6-7890-fghi-123456789012', '22222222-2222-2222-2222-222222222222', '电池能用多久？有保修吗？', true, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
('m9n0o1p2-q3r4-5678-nopq-901234567890', 'e1f2g3h4-i5j6-7890-fghi-123456789012', '11111111-1111-1111-1111-111111111111', '电池健康度95%，已经过保了', true, NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
('n0o1p2q3-r4s5-6789-opqr-012345678901', 'e1f2g3h4-i5j6-7890-fghi-123456789012', '22222222-2222-2222-2222-222222222222', '你好，这个MacBook还能便宜点吗？', false, NOW() - INTERVAL '1 day'),

-- 对话2的消息
('o1p2q3r4-s5t6-7890-pqrs-123456789012', 'f2g3h4i5-j6k7-8901-ghij-234567890123', '33333333-3333-3333-3333-333333333333', '你好，考研资料还在吗？', true, NOW() - INTERVAL '1 day'),
('p2q3r4s5-t6u7-8901-qrst-234567890123', 'f2g3h4i5-j6k7-8901-ghij-234567890123', '22222222-2222-2222-2222-222222222222', '还在的，资料很完整', true, NOW() - INTERVAL '1 day' + INTERVAL '3 minutes'),
('q3r4s5t6-u7v8-9012-rstu-345678901234', 'f2g3h4i5-j6k7-8901-ghij-234567890123', '33333333-3333-3333-3333-333333333333', '资料是完整的吗？包含答案解析吗？', false, NOW() - INTERVAL '3 hours'),

-- 对话3的消息
('r4s5t6u7-v8w9-0123-stuv-456789012345', 'g3h4i5j6-k7l8-9012-hijk-345678901234', '44444444-4444-4444-4444-444444444444', '自行车看起来不错，能便宜点吗？', true, NOW() - INTERVAL '6 hours'),
('s5t6u7v8-w9x0-1234-tuvw-567890123456', 'g3h4i5j6-k7l8-9012-hijk-345678901234', '33333333-3333-3333-3333-333333333333', '价格已经是最低了，车况很好', true, NOW() - INTERVAL '6 hours' + INTERVAL '5 minutes'),
('t6u7v8w9-x0y1-2345-uvwx-678901234567', 'g3h4i5j6-k7l8-9012-hijk-345678901234', '44444444-4444-4444-4444-444444444444', '自行车可以试骑吗？', false, NOW() - INTERVAL '2 hours'),

-- 对话4的消息
('u7v8w9x0-y1z2-3456-vwxy-789012345678', 'h4i5j6k7-l8m9-0123-ijkl-456789012345', '55555555-5555-5555-5555-555555555555', 'AirPods Pro还在吗？', true, NOW() - INTERVAL '1 day'),
('v8w9x0y1-z2a3-4567-wxyz-890123456789', 'h4i5j6k7-l8m9-0123-ijkl-456789012345', '11111111-1111-1111-1111-111111111111', '还在的，包装都没拆', true, NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
('w9x0y1z2-a3b4-5678-xyza-901234567890', 'h4i5j6k7-l8m9-0123-ijkl-456789012345', '55555555-5555-5555-5555-555555555555', 'AirPods还在吗？', false, NOW() - INTERVAL '4 hours'),

-- 对话5的消息
('x0y1z2a3-b4c5-6789-yzab-012345678901', 'i5j6k7l8-m9n0-1234-jklm-567890123456', '11111111-1111-1111-1111-111111111111', '你好，鞋子还在吗？', true, NOW() - INTERVAL '2 days'),
('y1z2a3b4-c5d6-7890-zabc-123456789012', 'i5j6k7l8-m9n0-1234-jklm-567890123456', '55555555-5555-5555-5555-555555555555', '还在的，42码', true, NOW() - INTERVAL '2 days' + INTERVAL '1 day'),
('z2a3b4c5-d6e7-8901-abcd-234567890123', 'i5j6k7l8-m9n0-1234-jklm-567890123456', '11111111-1111-1111-1111-111111111111', '42码合适吗？', false, NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  content = EXCLUDED.content,
  is_read = EXCLUDED.is_read;

-- 重新启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 第八步：验证数据插入结果
-- ====================================================================

-- 显示插入的数据统计
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;

-- 显示商品分类统计
SELECT category, COUNT(*) as product_count, AVG(price) as avg_price 
FROM products 
GROUP BY category 
ORDER BY product_count DESC;

-- 显示用户统计
SELECT '总用户数' as metric, COUNT(*) as count FROM profiles
UNION ALL
SELECT '活跃商品数', COUNT(*) FROM products WHERE status = 'available'
UNION ALL
SELECT '已售商品数', COUNT(*) FROM products WHERE status = 'sold'
UNION ALL
SELECT '总收藏数', COUNT(*) FROM favorites
UNION ALL
SELECT '总对话数', COUNT(*) FROM conversations
UNION ALL
SELECT '总消息数', COUNT(*) FROM messages;