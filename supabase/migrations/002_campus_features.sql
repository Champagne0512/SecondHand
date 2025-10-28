-- 校园功能拓展模块数据库迁移
-- 包含校园动态、活动、失物招领、价格分析等功能

-- ========================================
-- 1. 校园动态表
-- ========================================
CREATE TABLE IF NOT EXISTS campus_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'trade', 'event', 'help')),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 校园动态点赞表
CREATE TABLE IF NOT EXISTS campus_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES campus_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 校园动态评论表
CREATE TABLE IF NOT EXISTS campus_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES campus_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- 2. 校园活动表
-- ========================================
CREATE TABLE IF NOT EXISTS campus_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER DEFAULT 100,
  current_participants INTEGER DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('academic', 'social', 'sports', 'culture', 'volunteer')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 活动报名表
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES campus_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- ========================================
-- 3. 失物招领表
-- ========================================
CREATE TABLE IF NOT EXISTS lost_found_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  item_category TEXT NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  contact_info TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- 4. 价格分析相关表
-- ========================================
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS market_price_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  product_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(category, date)
);

CREATE TABLE IF NOT EXISTS monthly_price_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  product_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(category, month, year)
);

-- ========================================
-- 5. 用户行为追踪表
-- ========================================
CREATE TABLE IF NOT EXISTS user_behavior_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'favorite', 'search', 'click')),
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'post', 'event', 'search_term')),
  target_id TEXT,
  target_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- 6. 推荐系统相关表
-- ========================================
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('similar', 'trending', 'personalized')),
  score DECIMAL(5,2) NOT NULL,
  is_clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id, recommendation_type)
);

-- ========================================
-- 7. 创建存储过程和函数
-- ========================================

-- 增加活动参与人数的存储过程
CREATE OR REPLACE FUNCTION increment_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campus_events 
  SET current_participants = current_participants + 1 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- 减少活动参与人数的存储过程
CREATE OR REPLACE FUNCTION decrement_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campus_events 
  SET current_participants = GREATEST(current_participants - 1, 0) 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- 获取分类价格统计的存储过程
CREATE OR REPLACE FUNCTION get_category_price_statistics()
RETURNS TABLE (
  category TEXT,
  avg_price DECIMAL,
  min_price DECIMAL,
  max_price DECIMAL,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    AVG(p.price)::DECIMAL(10,2) as avg_price,
    MIN(p.price)::DECIMAL(10,2) as min_price,
    MAX(p.price)::DECIMAL(10,2) as max_price,
    COUNT(*) as product_count
  FROM products p
  WHERE p.status = 'available'
    AND p.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.category
  ORDER BY avg_price DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. 创建索引优化性能
-- ========================================

CREATE INDEX IF NOT EXISTS idx_campus_posts_user_id ON campus_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_posts_created_at ON campus_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_campus_posts_type ON campus_posts(type);
CREATE INDEX IF NOT EXISTS idx_campus_events_start_time ON campus_events(start_time);
CREATE INDEX IF NOT EXISTS idx_campus_events_category ON campus_events(category);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_type ON lost_found_items(type);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_created_at ON lost_found_items(created_at);
CREATE INDEX IF NOT EXISTS idx_product_price_history_product_id ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_recorded_at ON product_price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_market_price_trends_category_date ON market_price_trends(category, date);
CREATE INDEX IF NOT EXISTS idx_user_behavior_tracking_user_id ON user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_tracking_created_at ON user_behavior_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(score DESC);

-- ========================================
-- 9. 启用RLS（行级安全）
-- ========================================

ALTER TABLE campus_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_price_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. 创建RLS策略
-- ========================================

-- 校园动态策略
CREATE POLICY "用户可以查看所有校园动态" ON campus_posts
  FOR SELECT USING (true);

CREATE POLICY "认证用户可以发布校园动态" ON campus_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "用户可以更新自己的校园动态" ON campus_posts
  FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "用户可以删除自己的校园动态" ON campus_posts
  FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 校园活动策略
CREATE POLICY "用户可以查看所有校园活动" ON campus_events
  FOR SELECT USING (true);

CREATE POLICY "认证用户可以创建校园活动" ON campus_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 失物招领策略
CREATE POLICY "用户可以查看所有失物招领信息" ON lost_found_items
  FOR SELECT USING (true);

CREATE POLICY "认证用户可以发布失物招领信息" ON lost_found_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "用户可以更新自己的失物招领信息" ON lost_found_items
  FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 用户行为追踪策略
CREATE POLICY "用户可以查看自己的行为记录" ON user_behavior_tracking
  FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "用户可以记录自己的行为" ON user_behavior_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 推荐系统策略
CREATE POLICY "用户可以查看自己的推荐" ON user_recommendations
  FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "系统可以创建用户推荐" ON user_recommendations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- 11. 插入测试数据
-- ========================================

-- 插入校园动态测试数据
INSERT INTO campus_posts (id, user_id, content, images, type, location, tags, likes, comments) VALUES
('8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '今天在学校图书馆发现了一本绝版的好书，分享给大家！📚 这本书对我们的专业学习特别有帮助，有需要的同学可以来图书馆三楼找我借阅。', ARRAY['https://images.unsplash.com/photo-1481627834876-b6d793948c76?w=400'], 'text', '图书馆', ARRAY['学习', '分享', '图书'], 15, 3),
('09e88732-99ae-4afc-9b7c-43048e8e3fa4', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '明天下午2点在学生活动中心有编程技术分享会，欢迎对前端开发感兴趣的同学参加！🚀 我会分享一些Vue.js的实战经验。', '{}', 'event', '学生活动中心', ARRAY['技术分享', '前端', 'Vue.js'], 28, 8),
('3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '求助：有谁见过我的黑色钱包吗？可能在食堂或者教学楼丢失的，里面有很重要的证件😭 有线索请联系我，必有重谢！', '{}', 'help', '校园内', ARRAY['失物招领', '求助', '钱包'], 5, 2)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  likes = EXCLUDED.likes,
  comments = EXCLUDED.comments;

-- 插入校园活动测试数据
INSERT INTO campus_events (id, title, description, organizer, start_time, end_time, location, max_participants, current_participants, category, tags) VALUES
('event_001', '春季编程马拉松', '48小时编程挑战赛，组队参加，奖品丰厚！适合有一定编程基础的同学。', '计算机学院学生会', NOW() + INTERVAL '7 days', NOW() + INTERVAL '9 days', '计算机楼实验室', 50, 12, 'academic', ARRAY['编程', '比赛', '技术']),
('event_002', '校园二手市场交流会', '分享二手交易经验，学习如何更好地买卖闲置物品。', '校园二手平台', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', '学生活动中心201', 80, 25, 'social', ARRAY['二手交易', '经验分享', '交流']),
('event_003', '篮球友谊赛', '各学院篮球队友谊赛，欢迎观看比赛，为喜欢的队伍加油！', '体育学院', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '3 hours', '体育馆篮球场', 200, 45, 'sports', ARRAY['篮球', '比赛', '体育'])
ON CONFLICT (id) DO UPDATE SET
  current_participants = EXCLUDED.current_participants;

-- 插入失物招领测试数据
INSERT INTO lost_found_items (id, user_id, type, title, description, item_category, location, date, contact_info, status) VALUES
('lost_001', '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'lost', '黑色钱包丢失', '黑色折叠钱包，内有身份证、银行卡和少量现金。可能在食堂或教学楼丢失。', '钱包证件', '校园内', CURRENT_DATE - INTERVAL '2 days', '微信：zhangsan123 电话：13800138001', 'active'),
('found_001', '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'found', '捡到一串钥匙', '在图书馆门口捡到一串钥匙，有宿舍钥匙和自行车钥匙。', '钥匙', '图书馆门口', CURRENT_DATE - INTERVAL '1 day', '微信：lisi456 电话：13800138002', 'active')
ON CONFLICT (id) DO NOTHING;