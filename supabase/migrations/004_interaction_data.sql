-- 诗词网站互动数据填充
-- 为收藏表、评论表和浏览记录表添加示例数据

-- 首先创建示例用户（这些是虚拟用户ID，实际使用时需要替换为真实用户ID）
-- 注意：这些用户需要在Supabase Auth中创建后才能使用

-- 示例用户数据（使用固定的UUID，便于测试）
INSERT INTO profiles (id, username, avatar_url, bio, created_at) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '诗词爱好者',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    '热爱中国古典诗词，喜欢在诗词中寻找生活的诗意。每天都会阅读几首诗词来陶冶情操。',
    NOW() - INTERVAL '30 days'
),
(
    '22222222-2222-2222-2222-222222222222',
    '文学研究者',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '专注于中国古典文学研究，尤其喜欢唐诗宋词。致力于传统文化的传承和学术研究。',
    NOW() - INTERVAL '25 days'
),
(
    '33333333-3333-3333-3333-333333333333',
    '传统文化传承者',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    '致力于传统文化的传承和推广，希望通过诗词让更多人了解中华文化的魅力。',
    NOW() - INTERVAL '20 days'
),
(
    '44444444-4444-4444-4444-444444444444',
    '诗词初学者',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    '刚开始学习诗词，对古典文学充满好奇和热情，希望在这里学到更多知识。',
    NOW() - INTERVAL '15 days'
),
(
    '55555555-5555-5555-5555-555555555555',
    '诗词教师',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    '从事诗词教学工作多年，希望通过这个平台与更多诗词爱好者交流分享。',
    NOW() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- 示例收藏数据
INSERT INTO favorites (user_id, poem_id, created_at) VALUES
-- 诗词爱好者的收藏
('11111111-1111-1111-1111-111111111111', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '5 days'), -- 《将进酒》
('11111111-1111-1111-1111-111111111111', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '4 days'), -- 《水调歌头》
('11111111-1111-1111-1111-111111111111', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '3 days'), -- 《游子吟》
('11111111-1111-1111-1111-111111111111', '6ba7b81b-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '2 days'), -- 《相思》

-- 文学研究者的收藏
('22222222-2222-2222-2222-222222222222', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '6 days'), -- 《春望》
('22222222-2222-2222-2222-222222222222', '6ba7b815-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '5 days'), -- 《声声慢》
('22222222-2222-2222-2222-222222222222', '6ba7b81c-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '4 days'), -- 《出塞》
('22222222-2222-2222-2222-222222222222', '6ba7b81d-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '3 days'), -- 《雨霖铃》

-- 传统文化传承者的收藏
('33333333-3333-3333-3333-333333333333', '6ba7b812-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '7 days'), -- 《枫桥夜泊》
('33333333-3333-3333-3333-333333333333', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '6 days'), -- 《游子吟》
('33333333-3333-3333-3333-333333333333', '6ba7b817-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '5 days'), -- 《天净沙》
('33333333-3333-3333-3333-333333333333', '6ba7b820-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '4 days'), -- 《临江仙》

-- 诗词初学者的收藏
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '3 days'), -- 《静夜思》
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days'), -- 《春晓》
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day'),  -- 《登鹳雀楼》

-- 诗词教师的收藏
('55555555-5555-5555-5555-555555555555', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '8 days'), -- 《将进酒》
('55555555-5555-5555-5555-555555555555', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '7 days'), -- 《水调歌头》
('55555555-5555-5555-5555-555555555555', '6ba7b81e-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '6 days')  -- 《鹊桥仙》
ON CONFLICT (user_id, poem_id) DO NOTHING;

-- 示例评论数据
INSERT INTO comments (user_id, poem_id, content, created_at) VALUES
-- 《将进酒》的评论
('11111111-1111-1111-1111-111111111111', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 
 '李白的《将进酒》真是豪放不羁，读来令人心潮澎湃！"天生我材必有用，千金散尽还复来"这句尤其激励人心。',
 NOW() - INTERVAL '5 days'),
 
('22222222-2222-2222-2222-222222222222', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 
 '这首诗展现了盛唐时期文人的豪迈气概，是李白诗歌的代表作。诗中既有对人生的思考，也有及时行乐的洒脱。',
 NOW() - INTERVAL '4 days'),
 
('55555555-5555-5555-5555-555555555555', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 
 '作为教学材料，《将进酒》非常适合用来讲解李白的诗歌风格和盛唐文化背景。学生们都很喜欢这首诗。',
 NOW() - INTERVAL '3 days'),

-- 《水调歌头》的评论
('33333333-3333-3333-3333-333333333333', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', 
 '苏轼的《水调歌头》意境开阔，语言优美，是中秋词的经典。"但愿人长久，千里共婵娟"这句千古传诵。',
 NOW() - INTERVAL '6 days'),
 
('11111111-1111-1111-1111-111111111111', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', 
 '每次中秋都会想起这首词，苏轼对人生的豁达态度和对亲人的思念之情令人感动。',
 NOW() - INTERVAL '5 days'),

-- 《游子吟》的评论
('44444444-4444-4444-4444-444444444444', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', 
 '《游子吟》歌颂了母爱的伟大，每次读来都令人感动。"谁言寸草心，报得三春晖"这句特别打动人心。',
 NOW() - INTERVAL '4 days'),
 
('33333333-3333-3333-3333-333333333333', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', 
 '这首诗语言质朴，情感真挚，是歌颂母爱的经典之作。适合在母亲节等场合朗诵。',
 NOW() - INTERVAL '3 days'),

-- 《春望》的评论
('22222222-2222-2222-2222-222222222222', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 
 '杜甫的《春望》描绘了安史之乱后长安的荒凉景象，表达了诗人忧国忧民的情怀，体现了杜甫诗歌的现实主义特色。',
 NOW() - INTERVAL '7 days'),

-- 《声声慢》的评论
('55555555-5555-5555-5555-555555555555', '6ba7b815-9dad-11d1-80b4-00c04fd430c8', 
 '李清照的《声声慢》语言凄美，情感深沉，是婉约词的代表。开头的叠字运用尤为精妙。',
 NOW() - INTERVAL '6 days'),

-- 《静夜思》的评论
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 
 '《静夜思》是我学习的第一首唐诗，简单易懂却意境深远，非常适合诗词初学者。',
 NOW() - INTERVAL '2 days'),

-- 《春晓》的评论
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 
 '《春晓》描绘了春天的早晨，语言清新自然，充满了对生活的热爱和对自然的赞美。',
 NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 示例浏览历史数据
INSERT INTO browse_history (user_id, poem_id, viewed_at) VALUES
-- 诗词爱好者的浏览历史
('11111111-1111-1111-1111-111111111111', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '1 hour'),
('11111111-1111-1111-1111-111111111111', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '3 hours'),
('11111111-1111-1111-1111-111111111111', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '5 hours'),
('11111111-1111-1111-1111-111111111111', '6ba7b81b-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '1 day'),

-- 文学研究者的浏览历史
('22222222-2222-2222-2222-222222222222', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', '6ba7b815-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '4 hours'),
('22222222-2222-2222-2222-222222222222', '6ba7b81c-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '6 hours'),
('22222222-2222-2222-2222-222222222222', '6ba7b81d-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '2 days'),

-- 传统文化传承者的浏览历史
('33333333-3333-3333-3333-333333333333', '6ba7b812-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '3 hours'),
('33333333-3333-3333-3333-333333333333', '6ba7b813-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '7 hours'),
('33333333-3333-3333-3333-333333333333', '6ba7b817-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', '6ba7b820-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '3 days'),

-- 诗词初学者的浏览历史
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '1 hour'),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 hours'),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '4 hours'),

-- 诗词教师的浏览历史
('55555555-5555-5555-5555-555555555555', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '5 hours'),
('55555555-5555-5555-5555-555555555555', '6ba7b814-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '8 hours'),
('55555555-5555-5555-5555-555555555555', '6ba7b81e-9dad-11d1-80b4-00c04fd430c8', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 创建互动数据统计视图
CREATE OR REPLACE VIEW interaction_statistics AS
SELECT 
    (SELECT COUNT(*) FROM favorites) as total_favorites,
    (SELECT COUNT(*) FROM comments) as total_comments,
    (SELECT COUNT(*) FROM browse_history) as total_browse_records,
    (SELECT COUNT(DISTINCT user_id) FROM favorites) as users_with_favorites,
    (SELECT COUNT(DISTINCT user_id) FROM comments) as users_with_comments,
    (SELECT COUNT(DISTINCT user_id) FROM browse_history) as users_with_browse_history;

-- 创建热门互动诗词视图
CREATE OR REPLACE VIEW popular_interaction_poems AS
SELECT 
    p.id,
    p.title,
    p.author,
    p.dynasty,
    p.view_count,
    COUNT(DISTINCT f.id) as favorite_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT bh.id) as browse_count,
    (COUNT(DISTINCT f.id) + COUNT(DISTINCT c.id) * 2) as interaction_score
FROM poems p
LEFT JOIN favorites f ON p.id = f.poem_id
LEFT JOIN comments c ON p.id = c.poem_id
LEFT JOIN browse_history bh ON p.id = bh.poem_id
GROUP BY p.id, p.title, p.author, p.dynasty, p.view_count
ORDER BY interaction_score DESC, p.view_count DESC;

-- 创建用户活跃度视图
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    p.id as user_id,
    p.username,
    COUNT(DISTINCT f.id) as favorite_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT bh.id) as browse_count,
    (COUNT(DISTINCT f.id) + COUNT(DISTINCT c.id) * 2 + COUNT(DISTINCT bh.id) * 0.5) as activity_score
FROM profiles p
LEFT JOIN favorites f ON p.id = f.user_id
LEFT JOIN comments c ON p.id = c.user_id
LEFT JOIN browse_history bh ON p.id = bh.user_id
GROUP BY p.id, p.username
ORDER BY activity_score DESC;

-- 注释：这些示例数据使用了固定的UUID作为用户ID
-- 在实际部署时，这些用户需要在Supabase Auth中创建对应的用户账户
-- 或者可以使用真实的用户ID替换这些固定的UUID

-- 重要提示：在运行此文件前，请确保已经运行了001、002、003号迁移文件
-- 运行顺序：001 → 002 → 003 → 004