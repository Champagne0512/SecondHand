-- 诗词网站数据库实用函数和示例数据
-- 这些函数可以增强网站的功能性

-- 1. 获取用户收藏的诗词列表
CREATE OR REPLACE FUNCTION get_user_favorites(user_uuid UUID)
RETURNS TABLE(
    poem_id UUID,
    title VARCHAR,
    author VARCHAR,
    dynasty VARCHAR,
    favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as poem_id,
        p.title,
        p.author,
        p.dynasty,
        f.created_at as favorited_at
    FROM favorites f
    JOIN poems p ON f.poem_id = p.id
    WHERE f.user_id = user_uuid
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. 获取用户的浏览历史
CREATE OR REPLACE FUNCTION get_user_browse_history(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
    poem_id UUID,
    title VARCHAR,
    author VARCHAR,
    dynasty VARCHAR,
    viewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as poem_id,
        p.title,
        p.author,
        p.dynasty,
        bh.viewed_at
    FROM browse_history bh
    JOIN poems p ON bh.poem_id = p.id
    WHERE bh.user_id = user_uuid
    ORDER BY bh.viewed_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 3. 获取诗词的评论列表（包含用户信息）
CREATE OR REPLACE FUNCTION get_poem_comments(poem_uuid UUID)
RETURNS TABLE(
    comment_id UUID,
    content TEXT,
    username VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as comment_id,
        c.content,
        p.username,
        p.avatar_url,
        c.created_at
    FROM comments c
    JOIN profiles p ON c.user_id = p.id
    WHERE c.poem_id = poem_uuid
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. 获取热门标签
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    tag TEXT,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH tag_counts AS (
        SELECT unnest(tags) as tag, COUNT(*) as usage_count
        FROM poems
        GROUP BY tag
    )
    SELECT tag, usage_count
    FROM tag_counts
    WHERE tag IS NOT NULL AND tag != ''
    ORDER BY usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 按标签搜索诗词
CREATE OR REPLACE FUNCTION get_poems_by_tag(tag_name TEXT)
RETURNS SETOF poems AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM poems
    WHERE tags @> ARRAY[tag_name]::TEXT[]
    ORDER BY view_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. 获取用户统计数据
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
    favorite_count INTEGER,
    comment_count INTEGER,
    browse_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM favorites WHERE user_id = user_uuid) as favorite_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = user_uuid) as comment_count,
        (SELECT COUNT(*) FROM browse_history WHERE user_id = user_uuid) as browse_count;
END;
$$ LANGUAGE plpgsql;

-- 7. 随机获取诗词（用于推荐）
CREATE OR REPLACE FUNCTION get_random_poems(limit_count INTEGER DEFAULT 5)
RETURNS SETOF poems AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM poems
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 8. 获取相关诗词（基于标签相似度）
CREATE OR REPLACE FUNCTION get_related_poems(poem_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    author VARCHAR,
    dynasty VARCHAR,
    similarity_score INTEGER
) AS $$
DECLARE
    target_tags TEXT[];
BEGIN
    -- 获取目标诗词的标签
    SELECT tags INTO target_tags
    FROM poems
    WHERE id = poem_uuid;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.author,
        p.dynasty,
        array_length(array_intersect(p.tags, target_tags), 1) as similarity_score
    FROM poems p
    WHERE p.id != poem_uuid AND p.tags && target_tags
    ORDER BY similarity_score DESC, p.view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 辅助函数：计算数组交集长度
CREATE OR REPLACE FUNCTION array_intersect(arr1 TEXT[], arr2 TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[] := '{}';
    elem TEXT;
BEGIN
    FOREACH elem IN ARRAY arr1
    LOOP
        IF arr2 @> ARRAY[elem] THEN
            result := result || elem;
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 插入更多示例诗词数据
INSERT INTO poems (id, title, author, dynasty, content, analysis, tags) VALUES
(
    '550e8400-e29b-41d4-a716-446655440004',
    '望庐山瀑布',
    '李白',
    '唐代',
    '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。',
    '这首诗描绘了庐山瀑布的壮丽景色，运用夸张手法表现了瀑布的气势。',
    '{"瀑布", "庐山", "自然"}'
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    '江雪',
    '柳宗元',
    '唐代',
    '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
    '这首诗描绘了冬日江雪的寂静景象，表达了诗人孤独高洁的情怀。',
    '{"冬天", "雪景", "孤独"}'
),
(
    '550e8400-e29b-41d4-a716-446655440006',
    '赋得古原草送别',
    '白居易',
    '唐代',
    '离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。',
    '这首诗以草原为背景，表达了生命的顽强和离别的伤感。',
    '{"草原", "离别", "生命"}'
),
(
    '550e8400-e29b-41d4-a716-446655440007',
    '悯农',
    '李绅',
    '唐代',
    '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。',
    '这首诗反映了农民的辛勤劳动，倡导珍惜粮食的美德。',
    '{"农民", "劳动", "珍惜"}'
),
(
    '550e8400-e29b-41d4-a716-446655440008',
    '黄鹤楼送孟浩然之广陵',
    '李白',
    '唐代',
    '故人西辞黄鹤楼，烟花三月下扬州。\n孤帆远影碧空尽，唯见长江天际流。',
    '这首诗描绘了送别友人的场景，表达了深切的友情和离愁。',
    '{"送别", "友情", "长江"}'
);

-- 创建示例评论（需要先有用户数据）
-- 注意：这些评论需要在有真实用户后才能插入
-- INSERT INTO comments (user_id, poem_id, content) VALUES
-- ((SELECT id FROM profiles LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', '这首诗表达了深切的思乡之情，读来令人感动。'),
-- ((SELECT id FROM profiles LIMIT 1), '550e8400-e29b-41d4-a716-446655440001', '春天的早晨真是美好，这首诗完美地捕捉了这种感觉。');

-- 更新说明文档
COMMENT ON TABLE poems IS '存储诗词基本信息，包括标题、作者、朝代、内容等';
COMMENT ON TABLE profiles IS '存储用户资料信息，与Supabase Auth集成';
COMMENT ON TABLE favorites IS '存储用户收藏的诗词';
COMMENT ON TABLE comments IS '存储用户对诗词的评论';
COMMENT ON TABLE browse_history IS '存储用户的浏览历史';

COMMENT ON FUNCTION get_user_favorites IS '获取指定用户的收藏列表';
COMMENT ON FUNCTION get_user_browse_history IS '获取指定用户的浏览历史';
COMMENT ON FUNCTION get_poem_comments IS '获取指定诗词的评论列表（包含用户信息）';
COMMENT ON FUNCTION get_popular_tags IS '获取热门标签及其使用次数';
COMMENT ON FUNCTION get_poems_by_tag IS '按标签搜索诗词';
COMMENT ON FUNCTION get_user_stats IS '获取用户统计数据（收藏数、评论数、浏览数）';
COMMENT ON FUNCTION get_random_poems IS '随机获取诗词（用于推荐）';
COMMENT ON FUNCTION get_related_poems IS '获取相关诗词（基于标签相似度）';