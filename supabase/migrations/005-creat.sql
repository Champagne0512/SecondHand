-- 信用评价系统完整迁移文件
-- 创建时间: 2025-11-06
-- 作者: 校园二手交易平台开发团队

-- =============================================
-- 1. 创建信用评价相关表
-- =============================================

-- 用户信用评分表
CREATE TABLE IF NOT EXISTS user_credit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 基础信用分（基于用户资料完整度、验证状态等）
    base_score DECIMAL(5,2) NOT NULL DEFAULT 80.00 CHECK (base_score >= 0 AND base_score <= 100),
    
    -- 动态信用分（基于交易行为、评价等）
    dynamic_score DECIMAL(5,2) NOT NULL DEFAULT 80.00 CHECK (dynamic_score >= 0 AND dynamic_score <= 100),
    
    -- 综合信用分
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 80.00 CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- 信用等级 (A/B/C/D/E)
    credit_level CHAR(1) NOT NULL DEFAULT 'B' CHECK (credit_level IN ('A', 'B', 'C', 'D', 'E')),
    
    -- 交易统计
    total_transactions INTEGER NOT NULL DEFAULT 0 CHECK (total_transactions >= 0),
    successful_transactions INTEGER NOT NULL DEFAULT 0 CHECK (successful_transactions >= 0 AND successful_transactions <= total_transactions),
    
    -- 评价统计
    positive_reviews INTEGER NOT NULL DEFAULT 0 CHECK (positive_reviews >= 0),
    negative_reviews INTEGER NOT NULL DEFAULT 0 CHECK (negative_reviews >= 0),
    
    -- 活跃度指标
    activity_score DECIMAL(5,2) NOT NULL DEFAULT 60.00 CHECK (activity_score >= 0 AND activity_score <= 100),
    response_rate DECIMAL(5,2) NOT NULL DEFAULT 80.00 CHECK (response_rate >= 0 AND response_rate <= 100),
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 唯一约束
    UNIQUE(user_id)
);

-- 交易评价表
CREATE TABLE IF NOT EXISTS transaction_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联信息
    transaction_id UUID NOT NULL,
    product_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 评价内容
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- 评价维度
    communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
    product_accuracy_score INTEGER NOT NULL CHECK (product_accuracy_score >= 1 AND product_accuracy_score <= 5),
    delivery_speed_score INTEGER NOT NULL CHECK (delivery_speed_score >= 1 AND delivery_speed_score <= 5),
    
    -- 评价类型
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('buyer_to_seller', 'seller_to_buyer')),
    
    -- 状态控制
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT unique_review_per_transaction UNIQUE(transaction_id, reviewer_id, reviewed_user_id, review_type)
);

-- 信用行为记录表
CREATE TABLE IF NOT EXISTS credit_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联信息
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 行为信息
    behavior_type VARCHAR(50) NOT NULL CHECK (behavior_type IN (
        'register', 'complete_profile', 'verify_email', 'verify_phone',
        'publish_product', 'successful_transaction', 'positive_review_received',
        'negative_review_received', 'quick_response', 'late_response',
        'product_complaint', 'transaction_dispute', 'system_warning'
    )),
    
    description TEXT NOT NULL,
    score_change DECIMAL(5,2) NOT NULL,
    
    -- 关联实体（可选）
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. 启用行级安全策略 (RLS)
-- =============================================

-- 启用RLS
ALTER TABLE user_credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_behavior_logs ENABLE ROW LEVEL SECURITY;

-- 用户信用评分表策略
CREATE POLICY "用户可查看自己的信用评分" ON user_credit_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "系统可更新信用评分" ON user_credit_scores
    FOR UPDATE USING (true);

CREATE POLICY "系统可插入信用评分" ON user_credit_scores
    FOR INSERT WITH CHECK (true);

-- 交易评价表策略
CREATE POLICY "用户可查看相关评价" ON transaction_reviews
    FOR SELECT USING (
        auth.uid() = reviewer_id OR 
        auth.uid() = reviewed_user_id OR
        EXISTS (
            SELECT 1 FROM user_credit_scores 
            WHERE user_id = auth.uid() AND credit_level IN ('A', 'B')
        )
    );

CREATE POLICY "用户可插入自己的评价" ON transaction_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "系统可更新评价状态" ON transaction_reviews
    FOR UPDATE USING (true);

-- 信用行为记录表策略
CREATE POLICY "用户可查看自己的行为记录" ON credit_behavior_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "系统可插入行为记录" ON credit_behavior_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 3. 创建索引优化查询性能
-- =============================================

-- 用户信用评分表索引
CREATE INDEX IF NOT EXISTS idx_user_credit_scores_user_id ON user_credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_scores_credit_level ON user_credit_scores(credit_level);
CREATE INDEX IF NOT EXISTS idx_user_credit_scores_overall_score ON user_credit_scores(overall_score);

-- 交易评价表索引
CREATE INDEX IF NOT EXISTS idx_transaction_reviews_reviewed_user_id ON transaction_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reviews_reviewer_id ON transaction_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reviews_transaction_id ON transaction_reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reviews_rating ON transaction_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_transaction_reviews_created_at ON transaction_reviews(created_at);

-- 信用行为记录表索引
CREATE INDEX IF NOT EXISTS idx_credit_behavior_logs_user_id ON credit_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_behavior_logs_behavior_type ON credit_behavior_logs(behavior_type);
CREATE INDEX IF NOT EXISTS idx_credit_behavior_logs_created_at ON credit_behavior_logs(created_at);

-- =============================================
-- 4. 创建数据库函数
-- =============================================

-- 计算信用等级的函数
-- 先删除可能存在的旧版本函数
DROP FUNCTION IF EXISTS calculate_credit_level(DECIMAL);

CREATE OR REPLACE FUNCTION calculate_credit_level(score DECIMAL)
RETURNS CHAR AS $$
BEGIN
    RETURN CASE
        WHEN score >= 90 THEN 'A'
        WHEN score >= 80 THEN 'B'
        WHEN score >= 70 THEN 'C'
        WHEN score >= 60 THEN 'D'
        ELSE 'E'
    END;
END;
$$ LANGUAGE plpgsql;

-- 更新用户信用评分的函数
DROP FUNCTION IF EXISTS update_user_credit_score(UUID);

CREATE OR REPLACE FUNCTION update_user_credit_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_base_score DECIMAL := 80.00;
    v_dynamic_score DECIMAL := 80.00;
    v_total_transactions INTEGER := 0;
    v_successful_transactions INTEGER := 0;
    v_positive_reviews INTEGER := 0;
    v_negative_reviews INTEGER := 0;
    v_activity_score DECIMAL := 60.00;
    v_response_rate DECIMAL := 80.00;
    v_overall_score DECIMAL;
    v_credit_level CHAR;
BEGIN
    -- 获取交易统计数据
    SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO v_total_transactions, v_successful_transactions
    FROM transactions
    WHERE (buyer_id = p_user_id OR seller_id = p_user_id)
      AND status IN ('completed', 'cancelled');

    -- 获取评价统计数据
    SELECT 
        COUNT(CASE WHEN rating >= 4 THEN 1 END),
        COUNT(CASE WHEN rating <= 2 THEN 1 END)
    INTO v_positive_reviews, v_negative_reviews
    FROM transaction_reviews
    WHERE reviewed_user_id = p_user_id
      AND is_visible = true;

    -- 计算动态分数（基于交易成功率和评价）
    IF v_total_transactions > 0 THEN
        v_dynamic_score := 60.00 + 
            (v_successful_transactions::DECIMAL / v_total_transactions) * 20.00 +
            (v_positive_reviews::DECIMAL / GREATEST(v_positive_reviews + v_negative_reviews, 1)) * 20.00;
    END IF;

    -- 计算综合分数
    v_overall_score := (v_base_score * 0.3) + (v_dynamic_score * 0.7);
    
    -- 计算信用等级
    v_credit_level := calculate_credit_level(v_overall_score);

    -- 更新或插入信用记录
    INSERT INTO user_credit_scores (
        user_id, base_score, dynamic_score, overall_score, credit_level,
        total_transactions, successful_transactions, positive_reviews, negative_reviews,
        activity_score, response_rate
    ) VALUES (
        p_user_id, v_base_score, v_dynamic_score, v_overall_score, v_credit_level,
        v_total_transactions, v_successful_transactions, v_positive_reviews, v_negative_reviews,
        v_activity_score, v_response_rate
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        base_score = EXCLUDED.base_score,
        dynamic_score = EXCLUDED.dynamic_score,
        overall_score = EXCLUDED.overall_score,
        credit_level = EXCLUDED.credit_level,
        total_transactions = EXCLUDED.total_transactions,
        successful_transactions = EXCLUDED.successful_transactions,
        positive_reviews = EXCLUDED.positive_reviews,
        negative_reviews = EXCLUDED.negative_reviews,
        activity_score = EXCLUDED.activity_score,
        response_rate = EXCLUDED.response_rate,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- 处理交易评价的函数
DROP FUNCTION IF EXISTS process_transaction_review(UUID, UUID, UUID, UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, VARCHAR);

CREATE OR REPLACE FUNCTION process_transaction_review(
    p_transaction_id UUID,
    p_product_id UUID,
    p_reviewer_id UUID,
    p_reviewed_user_id UUID,
    p_rating INTEGER,
    p_comment TEXT,
    p_communication_score INTEGER,
    p_product_accuracy_score INTEGER,
    p_delivery_speed_score INTEGER,
    p_review_type VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
    v_score_change DECIMAL := 0.0;
BEGIN
    -- 插入评价记录
    INSERT INTO transaction_reviews (
        transaction_id, product_id, reviewer_id, reviewed_user_id,
        rating, comment, communication_score, product_accuracy_score, delivery_speed_score,
        review_type, is_verified, is_visible
    ) VALUES (
        p_transaction_id, p_product_id, p_reviewer_id, p_reviewed_user_id,
        p_rating, p_comment, p_communication_score, p_product_accuracy_score, p_delivery_speed_score,
        p_review_type, true, true
    )
    RETURNING id INTO v_review_id;

    -- 根据评价类型和评分计算信用分变化
    CASE 
        WHEN p_rating = 5 THEN v_score_change := 2.0;
        WHEN p_rating = 4 THEN v_score_change := 1.0;
        WHEN p_rating = 3 THEN v_score_change := 0.0;
        WHEN p_rating = 2 THEN v_score_change := -1.0;
        WHEN p_rating = 1 THEN v_score_change := -2.0;
        ELSE v_score_change := 0.0;
    END CASE;

    -- 记录信用行为
    INSERT INTO credit_behavior_logs (
        user_id, behavior_type, description, score_change,
        related_entity_type, related_entity_id
    ) VALUES (
        p_reviewed_user_id,
        CASE WHEN p_rating >= 4 THEN 'positive_review_received' ELSE 'negative_review_received' END,
        '收到' || CASE WHEN p_rating >= 4 THEN '好评' ELSE '差评' END,
        v_score_change,
        'review',
        v_review_id
    );

    -- 更新被评价用户的信用评分
    PERFORM update_user_credit_score(p_reviewed_user_id);

    RETURN v_review_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION '每个交易只能评价一次';
    WHEN OTHERS THEN
        RAISE EXCEPTION '评价处理失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 记录信用行为的函数
DROP FUNCTION IF EXISTS log_credit_behavior(UUID, VARCHAR, TEXT, DECIMAL, VARCHAR, UUID);

CREATE OR REPLACE FUNCTION log_credit_behavior(
    p_user_id UUID,
    p_behavior_type VARCHAR,
    p_description TEXT,
    p_score_change DECIMAL,
    p_related_entity_type VARCHAR DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_behavior_id UUID;
BEGIN
    -- 插入行为记录
    INSERT INTO credit_behavior_logs (
        user_id, behavior_type, description, score_change,
        related_entity_type, related_entity_id
    ) VALUES (
        p_user_id, p_behavior_type, p_description, p_score_change,
        p_related_entity_type, p_related_entity_id
    )
    RETURNING id INTO v_behavior_id;

    -- 更新用户信用评分
    PERFORM update_user_credit_score(p_user_id);

    RETURN v_behavior_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '记录行为失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 获取用户信用详情的函数
DROP FUNCTION IF EXISTS get_user_credit_details(UUID);

CREATE OR REPLACE FUNCTION get_user_credit_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    base_score DECIMAL,
    dynamic_score DECIMAL,
    overall_score DECIMAL,
    credit_level CHAR,
    total_transactions INTEGER,
    successful_transactions INTEGER,
    positive_reviews INTEGER,
    negative_reviews INTEGER,
    activity_score DECIMAL,
    response_rate DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    credit_level_description TEXT,
    success_rate DECIMAL,
    positive_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucs.id,
        ucs.user_id,
        ucs.base_score,
        ucs.dynamic_score,
        ucs.overall_score,
        ucs.credit_level,
        ucs.total_transactions,
        ucs.successful_transactions,
        ucs.positive_reviews,
        ucs.negative_reviews,
        ucs.activity_score,
        ucs.response_rate,
        ucs.created_at,
        ucs.updated_at,
        p.username,
        p.email,
        p.avatar_url,
        CASE ucs.credit_level
            WHEN 'A' THEN '信用极好'
            WHEN 'B' THEN '信用良好'
            WHEN 'C' THEN '信用一般'
            WHEN 'D' THEN '信用较差'
            WHEN 'E' THEN '信用差'
            ELSE '未知等级'
        END as credit_level_description,
        CASE WHEN ucs.total_transactions > 0 THEN 
            ROUND((ucs.successful_transactions::DECIMAL / ucs.total_transactions) * 100, 2)
            ELSE 0.00 
        END as success_rate,
        CASE WHEN (ucs.positive_reviews + ucs.negative_reviews) > 0 THEN 
            ROUND((ucs.positive_reviews::DECIMAL / (ucs.positive_reviews + ucs.negative_reviews)) * 100, 2)
            ELSE 0.00 
        END as positive_rate
    FROM user_credit_scores ucs
    LEFT JOIN profiles p ON ucs.user_id = p.id
    WHERE ucs.user_id = p_user_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '获取信用详情失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. 创建触发器
-- =============================================

-- 自动更新updated_at时间戳的触发器函数
-- 注意：此函数可能已被其他迁移文件创建，使用CREATE OR REPLACE即可
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为user_credit_scores表创建触发器
CREATE TRIGGER update_user_credit_scores_updated_at
    BEFORE UPDATE ON user_credit_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为transaction_reviews表创建触发器
CREATE TRIGGER update_transaction_reviews_updated_at
    BEFORE UPDATE ON transaction_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. 插入初始数据
-- =============================================

-- 为现有用户创建默认信用记录（可选）
-- INSERT INTO user_credit_scores (user_id)
-- SELECT id FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM user_credit_scores)
-- ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 7. 创建视图（可选）
-- =============================================

-- 用户信用统计视图
CREATE OR REPLACE VIEW user_credit_stats AS
SELECT 
    ucs.user_id,
    p.username,
    p.email,
    ucs.overall_score,
    ucs.credit_level,
    ucs.total_transactions,
    ucs.successful_transactions,
    ucs.positive_reviews,
    ucs.negative_reviews,
    CASE WHEN ucs.total_transactions > 0 THEN 
        ROUND((ucs.successful_transactions::DECIMAL / ucs.total_transactions) * 100, 2)
        ELSE 0.00 
    END as success_rate,
    CASE WHEN (ucs.positive_reviews + ucs.negative_reviews) > 0 THEN 
        ROUND((ucs.positive_reviews::DECIMAL / (ucs.positive_reviews + ucs.negative_reviews)) * 100, 2)
        ELSE 0.00 
    END as positive_rate,
    ucs.created_at,
    ucs.updated_at
FROM user_credit_scores ucs
LEFT JOIN profiles p ON ucs.user_id = p.id;

-- =============================================
-- 8. 注释说明
-- =============================================

COMMENT ON TABLE user_credit_scores IS '用户信用评分表，存储用户的信用评分和等级信息';
COMMENT ON TABLE transaction_reviews IS '交易评价表，存储用户之间的交易评价';
COMMENT ON TABLE credit_behavior_logs IS '信用行为记录表，记录影响信用评分的行为';

COMMENT ON COLUMN user_credit_scores.base_score IS '基础信用分（基于用户资料完整度、验证状态等）';
COMMENT ON COLUMN user_credit_scores.dynamic_score IS '动态信用分（基于交易行为、评价等）';
COMMENT ON COLUMN user_credit_scores.overall_score IS '综合信用分 = 基础分*0.3 + 动态分*0.7';
COMMENT ON COLUMN user_credit_scores.credit_level IS '信用等级：A(90-100), B(80-89), C(70-79), D(60-69), E(0-59)';

-- =============================================
-- 迁移完成
-- =============================================

-- 输出成功信息
DO $$ 
BEGIN
    RAISE NOTICE '信用评价系统数据库迁移完成！';
    RAISE NOTICE '已创建: 3个表, 6个函数, 2个触发器, 1个视图';
    RAISE NOTICE '已启用: 行级安全策略(RLS)';
    RAISE NOTICE '已创建: 性能索引';
END $$;