-- 诗词网站数据库初始化脚本
-- 创建所有必要的表、索引、存储过程和行级安全策略

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 诗词表 (poems)
CREATE TABLE poems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    dynasty VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    analysis TEXT,
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户资料表 (profiles) - 与Supabase Auth集成
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 收藏表 (favorites)
CREATE TABLE favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, poem_id)
);

-- 4. 评论表 (comments)
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 浏览历史表 (browse_history)
CREATE TABLE browse_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_poems_title ON poems(title);
CREATE INDEX idx_poems_author ON poems(author);
CREATE INDEX idx_poems_dynasty ON poems(dynasty);
CREATE INDEX idx_poems_created_at ON poems(created_at DESC);
CREATE INDEX idx_poems_view_count ON poems(view_count DESC);
CREATE INDEX idx_poems_favorite_count ON poems(favorite_count DESC);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_poem_id ON favorites(poem_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

CREATE INDEX idx_comments_poem_id ON comments(poem_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_user_id ON comments(user_id);

CREATE INDEX idx_browse_history_user_id ON browse_history(user_id);
CREATE INDEX idx_browse_history_viewed_at ON browse_history(viewed_at DESC);

-- 创建全文搜索索引
CREATE INDEX idx_poems_search ON poems USING gin(
    to_tsvector('simple', title || ' ' || author || ' ' || content)
);

-- 创建存储过程

-- 首先删除可能已存在的函数（避免类型冲突）
DROP FUNCTION IF EXISTS search_poems(text) CASCADE;
DROP FUNCTION IF EXISTS increment_poem_view_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_poems_by_dynasty(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_popular_poems(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_recent_poems(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_poem_favorite_count() CASCADE;
DROP FUNCTION IF EXISTS update_poem_comment_count() CASCADE;

-- 1. 增加诗词浏览次数
CREATE OR REPLACE FUNCTION increment_poem_view_count(poem_id UUID, user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE poems 
    SET view_count = view_count + 1 
    WHERE id = poem_id;
    
    -- 如果提供了用户ID，记录浏览历史
    IF user_id IS NOT NULL THEN
        INSERT INTO browse_history (user_id, poem_id, viewed_at)
        VALUES (user_id, poem_id, NOW())
        ON CONFLICT (user_id, poem_id) 
        DO UPDATE SET viewed_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 搜索诗词
CREATE OR REPLACE FUNCTION search_poems(query_text TEXT)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    author VARCHAR,
    dynasty VARCHAR,
    content TEXT,
    view_count INTEGER,
    favorite_count INTEGER,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.author,
        p.dynasty,
        p.content,
        p.view_count,
        p.favorite_count,
        ts_rank(to_tsvector('simple', p.title || ' ' || p.author || ' ' || p.content), 
                to_tsquery('simple', query_text)) as search_rank
    FROM poems p
    WHERE 
        p.title ILIKE '%' || query_text || '%' OR
        p.author ILIKE '%' || query_text || '%' OR
        p.content ILIKE '%' || query_text || '%' OR
        to_tsvector('simple', p.title || ' ' || p.author || ' ' || p.content) @@ to_tsquery('simple', query_text)
    ORDER BY search_rank DESC, p.view_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. 按朝代筛选诗词
CREATE OR REPLACE FUNCTION get_poems_by_dynasty(dynasty_name VARCHAR)
RETURNS SETOF poems AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM poems
    WHERE dynasty = dynasty_name
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. 获取热门诗词
CREATE OR REPLACE FUNCTION get_popular_poems(limit_count INTEGER DEFAULT 10)
RETURNS SETOF poems AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM poems
    ORDER BY view_count DESC, favorite_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 获取最新诗词
CREATE OR REPLACE FUNCTION get_recent_poems(limit_count INTEGER DEFAULT 10)
RETURNS SETOF poems AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM poems
    ORDER BY created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 6. 更新收藏计数（触发器函数）
CREATE OR REPLACE FUNCTION update_poem_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE poems 
        SET favorite_count = favorite_count + 1,
            updated_at = NOW()
        WHERE id = NEW.poem_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poems 
        SET favorite_count = favorite_count - 1,
            updated_at = NOW()
        WHERE id = OLD.poem_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 更新评论计数（触发器函数）
CREATE OR REPLACE FUNCTION update_poem_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE poems 
        SET comment_count = comment_count + 1,
            updated_at = NOW()
        WHERE id = NEW.poem_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poems 
        SET comment_count = comment_count - 1,
            updated_at = NOW()
        WHERE id = OLD.poem_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_favorite_count
    AFTER INSERT OR DELETE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_poem_favorite_count();

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_poem_comment_count();

-- 设置行级安全策略 (RLS)

-- 启用RLS
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE browse_history ENABLE ROW LEVEL SECURITY;

-- 1. poems表策略：所有人都可以读取，只有管理员可以修改
CREATE POLICY "任何人都可以查看诗词" ON poems
    FOR SELECT USING (true);

CREATE POLICY "只有管理员可以修改诗词" ON poems
    FOR ALL USING (auth.role() = 'authenticated' AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'admin'));

-- 2. profiles表策略：用户可以查看所有资料，只能修改自己的资料
CREATE POLICY "用户可以查看所有资料" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "用户只能修改自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的资料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. favorites表策略：用户可以查看所有收藏，只能操作自己的收藏
CREATE POLICY "用户可以查看所有收藏" ON favorites
    FOR SELECT USING (true);

CREATE POLICY "用户只能操作自己的收藏" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- 4. comments表策略：用户可以查看所有评论，只能操作自己的评论
CREATE POLICY "用户可以查看所有评论" ON comments
    FOR SELECT USING (true);

CREATE POLICY "用户只能操作自己的评论" ON comments
    FOR ALL USING (auth.uid() = user_id);

-- 5. browse_history表策略：用户只能查看和操作自己的浏览历史
CREATE POLICY "用户只能查看自己的浏览历史" ON browse_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能操作自己的浏览历史" ON browse_history
    FOR ALL USING (auth.uid() = user_id);

-- 创建插入用户资料触发器（当新用户注册时自动创建profile）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, created_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 插入示例数据
INSERT INTO poems (id, title, author, dynasty, content, analysis, tags) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    '静夜思',
    '李白',
    '唐代',
    '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    '这首诗通过描绘月夜思乡的场景，表达了诗人对故乡的深切思念。语言简洁，意境深远。',
    '{"思乡", "月亮", "夜晚"}'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    '春晓',
    '孟浩然',
    '唐代',
    '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
    '这首诗描绘了春天的早晨，通过鸟鸣和风雨声，展现了春天的生机和变化。',
    '{"春天", "早晨", "自然"}'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '登鹳雀楼',
    '王之涣',
    '唐代',
    '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
    '这首诗通过登高望远，表达了积极向上的人生态度和对美好未来的向往。',
    '{"登高", "黄河", "人生"}'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '相思',
    '王维',
    '唐代',
    '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
    '这首诗以红豆为象征，表达了深切的相思之情，语言优美，情感真挚。',
    '{"相思", "爱情", "红豆"}'
);

-- 创建管理员用户（需要在Supabase Auth中手动创建用户后运行）
-- INSERT INTO profiles (id, username, bio) VALUES 
-- ('admin-user-id', 'admin', '系统管理员');

-- 注释：在Supabase控制台中运行此SQL文件后，需要在Authentication中创建用户
-- 然后可以手动将某个用户设置为管理员（通过更新profiles表中的username为'admin'）