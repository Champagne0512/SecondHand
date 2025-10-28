-- 校园二手平台测试数据生成脚本
-- 这个文件用于生成更多的测试数据，避免修改现有的迁移文件

-- ========================================
-- 1. 生成更多校园动态测试数据
-- ========================================

-- 插入更多校园动态测试数据（使用现有的用户ID）
INSERT INTO campus_posts (id, user_id, content, images, type, location, tags, likes, comments) VALUES
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '今天在图书馆发现了一本绝版的好书，分享给大家！📚 这本书对我们的专业学习特别有帮助，有需要的同学可以来图书馆三楼找我借阅。', ARRAY['https://images.unsplash.com/photo-1481627834876-b6d793948c76?w=400'], 'text', '图书馆', ARRAY['学习', '分享', '图书'], 15, 3),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '明天下午2点在学生活动中心有编程技术分享会，欢迎对前端开发感兴趣的同学参加！🚀 我会分享一些Vue.js的实战经验。', '{}', 'event', '学生活动中心', ARRAY['技术分享', '前端', 'Vue.js'], 28, 8),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '求助：有谁见过我的黑色钱包吗？可能在食堂或者教学楼丢失的，里面有很重要的证件😭 有线索请联系我，必有重谢！', '{}', 'help', '校园内', ARRAY['失物招领', '求助', '钱包'], 5, 2),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '刚从健身房回来，感觉整个人都精神了！💪 推荐大家多去运动，对身体和学习都有好处。#健康生活', ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'], 'image', '体育馆', ARRAY['运动', '健康', '生活'], 32, 12),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '分享一个学习小技巧：番茄工作法真的很有用！25分钟专注学习，5分钟休息，效率提升明显。大家可以试试～', '{}', 'text', '图书馆', ARRAY['学习技巧', '效率', '分享'], 18, 6),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '今天在食堂吃到了新出的麻辣香锅，味道超赞！🔥 而且价格还很实惠，推荐给大家。', ARRAY['https://images.unsplash.com/photo-1555126634-323283e090fa?w=400'], 'image', '食堂', ARRAY['美食', '推荐', '生活'], 25, 9),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '出闲置：九成新的《算法导论》，适合计算机专业的同学。原价88元，现45元出，有笔记但保存完好。', '{}', 'trade', '宿舍区', ARRAY['二手书', '教材', '计算机'], 8, 4),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', '周末组织了一次爬山活动，虽然很累但是风景真的太美了！🌄 下次还想组织类似的活动，有人想参加吗？', ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'], 'image', '校外', ARRAY['户外活动', '爬山', '运动'], 42, 15),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '提醒：最近天气变化大，大家要注意保暖，别感冒了。我这边有感冒药和退烧药，需要的同学可以联系我。', '{}', 'help', '校园内', ARRAY['健康', '提醒', '药品'], 12, 3),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', '刚完成了一个大项目，感觉收获满满！🎉 感谢团队的小伙伴们的支持，也感谢老师的指导。继续加油！', '{}', 'text', '实验室', ARRAY['项目', '学习', '感谢'], 38, 11)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. 生成更多校园活动测试数据
-- ========================================

INSERT INTO campus_events (id, title, description, organizer, start_time, end_time, location, max_participants, current_participants, category, tags) VALUES
(gen_random_uuid(), '春季摄影大赛', '捕捉校园美景，展现青春活力。优秀作品将在学校官网展示，获奖者将获得丰厚奖品。', '摄影社团', NOW() + INTERVAL '10 days', NOW() + INTERVAL '17 days', '校园各角落', 100, 28, 'culture', ARRAY['摄影', '比赛', '文化']),
(gen_random_uuid(), '考研经验分享会', '邀请成功上岸的学长学姐分享备考经验，包括复习规划、心态调整、院校选择等。', '学生会学习部', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '3 hours', '学术报告厅', 200, 45, 'academic', ARRAY['考研', '经验分享', '学习']),
(gen_random_uuid(), '校园歌手大赛', '展现音乐才华，唱出青春风采。初赛、复赛、决赛三轮赛制，专业评委点评。', '音乐社团', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '4 hours', '大礼堂', 300, 67, 'culture', ARRAY['音乐', '比赛', '文艺']),
(gen_random_uuid(), '志愿者招募活动', '参与社区服务，奉献爱心力量。包括敬老院服务、环保宣传、支教活动等。', '青年志愿者协会', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '6 hours', '社区服务中心', 150, 34, 'volunteer', ARRAY['志愿者', '公益', '服务']),
(gen_random_uuid(), '篮球3V3对抗赛', '热血篮球，激情对抗。组队报名，循环赛制，展现团队协作精神。', '篮球社团', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '5 hours', '体育馆篮球场', 60, 18, 'sports', ARRAY['篮球', '比赛', '体育']),
(gen_random_uuid(), '创新创业讲座', '邀请成功创业者分享创业经历，介绍创新思维和商业模式。', '创新创业学院', NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '2 hours', '创业园报告厅', 180, 52, 'academic', ARRAY['创业', '创新', '讲座']),
(gen_random_uuid(), '国际文化交流节', '体验不同国家文化，品尝各国美食，观看民族表演，促进文化交流。', '国际交流协会', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '8 hours', '国际交流中心', 400, 89, 'social', ARRAY['文化交流', '国际', '美食']),
(gen_random_uuid(), '编程马拉松Hackathon', '48小时不间断编程挑战，组队完成创意项目，评委评选优秀作品。', '计算机学院', NOW() + INTERVAL '25 days', NOW() + INTERVAL '27 days', '计算机楼实验室', 80, 23, 'academic', ARRAY['编程', '马拉松', '技术'])
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. 生成更多失物招领测试数据
-- ========================================

INSERT INTO lost_found_items (id, user_id, type, title, description, item_category, location, date, contact_info, status) VALUES
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'lost', '蓝色水杯丢失', '蓝色保温杯，上面有小熊贴纸，可能在教学楼A区丢失。', '水杯', '教学楼A区', CURRENT_DATE - INTERVAL '3 days', '微信：zhangsan123 电话：13800138001', 'active'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'found', '捡到黑色耳机', '在图书馆二楼自习室捡到一副黑色耳机，品牌是Sony。', '耳机', '图书馆二楼', CURRENT_DATE - INTERVAL '1 day', '微信：lisi456 电话：13800138002', 'active'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'lost', '学生证丢失', '本人学生证不慎丢失，姓名王五，有捡到者请联系我，必有重谢！', '学生证', '校园内', CURRENT_DATE - INTERVAL '2 days', '微信：wangwu789 电话：13800138003', 'active'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'found', '捡到一串钥匙', '在食堂门口捡到一串钥匙，有宿舍钥匙和自行车钥匙，钥匙扣是蓝色的。', '钥匙', '食堂门口', CURRENT_DATE - INTERVAL '1 day', '微信：zhangsan123 电话：13800138001', 'active'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'lost', '白色手机丢失', '白色iPhone 12，手机壳是透明的，里面有身份证照片，在体育馆运动时丢失。', '手机', '体育馆', CURRENT_DATE - INTERVAL '4 days', '微信：lisi456 电话：13800138002', 'active'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'found', '捡到银行卡', '在ATM机旁边捡到一张银行卡，是中国银行的，卡主姓名是*明。', '银行卡', '校园ATM机', CURRENT_DATE - INTERVAL '1 day', '微信：wangwu789 电话：13800138003', 'active'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'lost', '黑色背包丢失', '黑色双肩包，里面有笔记本电脑和学习资料，可能在图书馆丢失。', '书包', '图书馆', CURRENT_DATE - INTERVAL '5 days', '微信：zhangsan123 电话：13800138001', 'active'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'found', '捡到身份证', '在教学楼B区走廊捡到一张身份证，姓名张*，1999年出生。', '身份证', '教学楼B区', CURRENT_DATE - INTERVAL '2 days', '微信：lisi456 电话：13800138002', 'active')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 4. 生成价格分析测试数据
-- ========================================

-- 插入产品价格历史数据（基于现有商品）
INSERT INTO product_price_history (id, product_id, price, recorded_at) VALUES
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6800.00, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6700.00, NOW() - INTERVAL '10 days'),
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6600.00, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 1300.00, NOW() - INTERVAL '12 days'),
(gen_random_uuid(), 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 1250.00, NOW() - INTERVAL '7 days'),
(gen_random_uuid(), 'c3d4e5f6-a7b8-9012-cdef-345678901234', 3400.00, NOW() - INTERVAL '20 days'),
(gen_random_uuid(), 'c3d4e5f6-a7b8-9012-cdef-345678901234', 3300.00, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'c3d4e5f6-a7b8-9012-cdef-345678901234', 3200.00, NOW() - INTERVAL '8 days'),
(gen_random_uuid(), 'd4e5f6a7-b8c9-0123-def0-456789012345', 1600.00, NOW() - INTERVAL '18 days'),
(gen_random_uuid(), 'd4e5f6a7-b8c9-0123-def0-456789012345', 1550.00, NOW() - INTERVAL '12 days'),
(gen_random_uuid(), 'd4e5f6a7-b8c9-0123-def0-456789012345', 1500.00, NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- 插入市场趋势数据
INSERT INTO market_price_trends (id, category, date, avg_price, min_price, max_price, product_count, created_at) VALUES
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '30 days', 3200.00, 1200.00, 6800.00, 25, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '25 days', 3150.00, 1150.00, 6750.00, 28, NOW() - INTERVAL '25 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '20 days', 3100.00, 1100.00, 6700.00, 32, NOW() - INTERVAL '20 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '15 days', 3050.00, 1050.00, 6650.00, 30, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '10 days', 3000.00, 1000.00, 6600.00, 35, NOW() - INTERVAL '10 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE - INTERVAL '5 days', 2950.00, 950.00, 6550.00, 38, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'electronics', CURRENT_DATE, 2900.00, 900.00, 6500.00, 40, NOW()),
(gen_random_uuid(), 'books', CURRENT_DATE - INTERVAL '15 days', 45.00, 15.00, 80.00, 18, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'books', CURRENT_DATE - INTERVAL '10 days', 43.00, 13.00, 78.00, 20, NOW() - INTERVAL '10 days'),
(gen_random_uuid(), 'books', CURRENT_DATE - INTERVAL '5 days', 41.00, 11.00, 76.00, 22, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'books', CURRENT_DATE, 39.00, 9.00, 74.00, 25, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入月度统计数据
INSERT INTO monthly_price_stats (id, category, month, year, avg_price, min_price, max_price, product_count, created_at) VALUES
(gen_random_uuid(), 'electronics', 9, 2024, 3100.00, 900.00, 6800.00, 120, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'electronics', 10, 2024, 2950.00, 850.00, 6650.00, 135, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'books', 9, 2024, 42.00, 12.00, 78.00, 85, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'books', 10, 2024, 39.00, 9.00, 74.00, 95, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'clothing', 9, 2024, 180.00, 50.00, 400.00, 65, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'clothing', 10, 2024, 175.00, 45.00, 385.00, 72, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'sports', 9, 2024, 150.00, 30.00, 350.00, 45, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'sports', 10, 2024, 145.00, 25.00, 335.00, 52, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'daily', 9, 2024, 85.00, 20.00, 200.00, 38, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'daily', 10, 2024, 80.00, 18.00, 185.00, 42, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. 生成用户行为追踪测试数据
-- ========================================

INSERT INTO user_behavior_tracking (id, user_id, action_type, target_type, target_id, target_data, created_at) VALUES
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'view', 'product', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"category": "electronics", "price": 6500}', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'favorite', 'product', 'c3d4e5f6-a7b8-9012-cdef-345678901234', '{"category": "electronics", "price": 3200}', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'view', 'product', 'd4e5f6a7-b8c9-0123-def0-456789012345', '{"category": "electronics", "price": 1500}', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'search', 'search_term', 'search_001', '{"term": "耳机"}', NOW() - INTERVAL '5 hours'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'view', 'post', '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', '{"type": "help"}', NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'click', 'event', 'event_001', '{"category": "academic"}', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'view', 'product', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"category": "electronics", "price": 1200}', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'favorite', 'product', 'f6a7b8c9-d0e1-2345-f123-678901234567', '{"category": "books", "price": 50}', NOW() - INTERVAL '30 minutes'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'search', 'search_term', 'search_002', '{"term": "考研资料"}', NOW() - INTERVAL '15 minutes'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'click', 'product', 'a7b8c9d0-e1f2-3456-a234-789012345678', '{"category": "books", "price": 45}', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 6. 生成用户推荐测试数据
-- ========================================

INSERT INTO user_recommendations (id, user_id, product_id, recommendation_type, score, is_clicked, created_at) VALUES
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'similar', 92.50, true, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'd4e5f6a7-b8c9-0123-def0-456789012345', 'trending', 88.75, false, NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'personalized', 95.20, true, NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'similar', 89.30, false, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'f6a7b8c9-d0e1-2345-f123-678901234567', 'trending', 91.80, true, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'c9d0e1f2-e3d4-5678-c456-901234567890', 'personalized', 87.65, false, NOW() - INTERVAL '12 hours'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'd0e1f2d3-e4f5-6789-d567-012345678901', 'similar', 93.45, true, NOW() - INTERVAL '8 hours'),
(gen_random_uuid(), '09e88732-99ae-4afc-9b7c-43048e8e3fa4', 'a4b5c6d7-e8f9-0123-a456-789012345678', 'trending', 86.90, false, NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77', 'b5c6d7e8-f9a0-1234-b567-890123456789', 'personalized', 90.25, true, NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), '8768e8dc-aa31-48b7-b769-b9eb1dcdad54', 'c6d7e8f9-a0b1-2345-c678-901234567890', 'similar', 88.70, false, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. 生成点赞和评论数据
-- ========================================

-- 为校园动态生成点赞数据
INSERT INTO campus_post_likes (id, post_id, user_id, created_at) 
SELECT 
  gen_random_uuid(),
  cp.id,
  p.id,
  NOW() - (random() * INTERVAL '7 days')
FROM campus_posts cp
CROSS JOIN profiles p
WHERE random() < 0.3  -- 30%的概率点赞
AND cp.user_id != p.id  -- 不给自己点赞
LIMIT 50;  -- 限制数量避免过多

-- 为校园动态生成评论数据
INSERT INTO campus_post_comments (id, post_id, user_id, content, created_at)
SELECT 
  gen_random_uuid(),
  cp.id,
  p.id,
  CASE (random() * 5)::int
    WHEN 0 THEN '说得太好了！'
    WHEN 1 THEN '支持支持！'
    WHEN 2 THEN '学习了，很有用！'
    WHEN 3 THEN '我也遇到过类似情况'
    WHEN 4 THEN '感谢分享！'
    ELSE '加油！'
  END,
  NOW() - (random() * INTERVAL '7 days')
FROM campus_posts cp
CROSS JOIN profiles p
WHERE random() < 0.2  -- 20%的概率评论
AND cp.user_id != p.id  -- 不给自己评论
LIMIT 30;  -- 限制数量避免过多

-- ========================================
-- 8. 生成活动报名数据
-- ========================================

INSERT INTO event_registrations (id, event_id, user_id, registered_at)
SELECT 
  gen_random_uuid(),
  ce.id,
  p.id,
  NOW() - (random() * INTERVAL '10 days')
FROM campus_events ce
CROSS JOIN profiles p
WHERE random() < 0.4  -- 40%的概率报名
LIMIT 80;  -- 限制数量避免过多

-- ========================================
-- 9. 生成收藏数据
-- ========================================

INSERT INTO favorites (id, user_id, product_id, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  pr.id,
  NOW() - (random() * INTERVAL '30 days')
FROM profiles p
CROSS JOIN products pr
WHERE random() < 0.25  -- 25%的概率收藏
AND p.id != pr.seller_id  -- 不收藏自己的商品
LIMIT 100;  -- 限制数量避免过多

-- ========================================
-- 10. 生成对话和消息数据
-- ========================================

-- 生成对话数据
INSERT INTO conversations (id, product_id, buyer_id, seller_id, last_message, last_message_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  buyer.id,
  p.seller_id,
  CASE (random() * 4)::int
    WHEN 0 THEN '这个还能便宜点吗？'
    WHEN 1 THEN '商品还在吗？'
    WHEN 2 THEN '可以面交吗？'
    WHEN 3 THEN '最低多少钱？'
    ELSE '诚心要，能刀吗？'
  END,
  NOW() - (random() * INTERVAL '3 days'),
  NOW() - (random() * INTERVAL '7 days'),
  NOW() - (random() * INTERVAL '1 day')
FROM products p
CROSS JOIN profiles buyer
WHERE random() < 0.3  -- 30%的概率有对话
AND p.seller_id != buyer.id  -- 不和自己对话
LIMIT 50;  -- 限制对话数量

-- 生成消息数据
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  CASE WHEN random() < 0.5 THEN c.buyer_id ELSE c.seller_id END,
  CASE (random() * 5)::int
    WHEN 0 THEN '你好，这个商品还在吗？'
    WHEN 1 THEN '最低能多少钱出？'
    WHEN 2 THEN '可以看看实物照片吗？'
    WHEN 3 THEN '什么时候方便交易？'
    WHEN 4 THEN '我是诚心要的，能便宜点吗？'
    ELSE '好的，我考虑一下'
  END,
  random() > 0.3,  -- 70%的概率已读
  NOW() - (random() * INTERVAL '5 days')
FROM conversations c
CROSS JOIN generate_series(1, (random() * 4 + 1)::int)  -- 每个对话1-5条消息
LIMIT 200;  -- 限制消息数量

-- ========================================
-- 完成提示
-- ========================================

-- 数据生成完成
SELECT '测试数据生成完成！总计生成了：
- 校园动态：10条
- 校园活动：8个  
- 失物招领：8条
- 价格历史：11条
- 市场趋势：12条
- 月度统计：10条
- 用户行为：10条
- 用户推荐：10条
- 动态点赞：根据概率生成
- 动态评论：根据概率生成
- 活动报名：根据概率生成
- 商品收藏：根据概率生成
- 对话：根据概率生成
- 消息：根据概率生成' as completion_message;