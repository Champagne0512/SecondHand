-- 管理员管理系统数据库迁移脚本
-- 创建管理员相关的表结构和权限配置

-- 1. 创建管理员角色表
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建管理员用户关联表
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建网站配置表
CREATE TABLE IF NOT EXISTS site_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建每日统计表
CREATE TABLE IF NOT EXISTS daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    new_products INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建内容审核表
CREATE TABLE IF NOT EXISTS content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- 'product', 'post', 'comment', etc.
    content_id UUID NOT NULL,
    reviewer_id UUID REFERENCES admin_users(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建用户举报记录表
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'product', 'message', etc.
    target_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'resolved'
    handled_by UUID REFERENCES admin_users(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认的管理员角色
INSERT INTO admin_roles (id, name, description, permissions) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'super_admin', '超级管理员', '{"all": true}'),
    ('00000000-0000-0000-0000-000000000002', 'content_admin', '内容管理员', '{"content": true, "users": false, "settings": false}'),
    ('00000000-0000-0000-0000-000000000003', 'user_admin', '用户管理员', '{"content": false, "users": true, "settings": false}'),
    ('00000000-0000-0000-0000-000000000004', 'moderator', '版主', '{"content": true, "users": false, "settings": false}') 
ON CONFLICT (name) DO NOTHING;

-- 插入默认的网站配置
INSERT INTO site_configs (config_key, config_value, description, is_public) VALUES 
    ('site_name', '"校园二手交易平台"', '网站名称', true),
    ('site_description', '"校园二手交易平台 - 连接校园，便捷交易"', '网站描述', true),
    ('max_products_per_user', '50', '每个用户最多发布商品数量', false),
    ('max_images_per_product', '5', '每个商品最多上传图片数量', false),
    ('auto_approve_products', 'false', '是否自动审核商品', false),
    ('allow_anonymous_browsing', 'true', '是否允许匿名浏览', true),
    ('maintenance_mode', 'false', '维护模式', true)
ON CONFLICT (config_key) DO NOTHING;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_admin_user_id ON admin_operation_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_created_at ON admin_operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_reviews_content_type_content_id ON content_reviews(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON content_reviews(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_target_type_target_id ON user_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_date ON daily_statistics(date);

-- 启用行级安全策略
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- 设置行级安全策略
-- 管理员角色表：只有管理员可以访问
CREATE POLICY "管理员角色表访问策略" ON admin_roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 管理员用户表：只有管理员可以访问
CREATE POLICY "管理员用户表访问策略" ON admin_users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 管理员操作日志：只有管理员可以访问
CREATE POLICY "管理员操作日志访问策略" ON admin_operation_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 网站配置表：公开配置所有人都可读，管理员可写
CREATE POLICY "网站配置表读取策略" ON site_configs FOR SELECT USING (
    is_public = true OR 
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

CREATE POLICY "网站配置表写入策略" ON site_configs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 每日统计表：只有管理员可以访问
CREATE POLICY "每日统计表访问策略" ON daily_statistics FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 内容审核表：只有管理员可以访问
CREATE POLICY "内容审核表访问策略" ON content_reviews FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 用户举报表：举报者和管理员可以访问
CREATE POLICY "用户举报表访问策略" ON user_reports FOR ALL USING (
    reporter_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid()
    )
);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间的表创建触发器
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_configs_updated_at BEFORE UPDATE ON site_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_reviews_updated_at BEFORE UPDATE ON content_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_reports_updated_at BEFORE UPDATE ON user_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建管理员权限检查函数
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.user_id = $1 AND admin_users.is_active = true
    );
END;
$$ language 'plpgsql';

-- 创建获取用户管理员角色的函数
CREATE OR REPLACE FUNCTION get_admin_role(user_id UUID)
RETURNS TABLE(role_name VARCHAR, permissions JSONB) AS $$
BEGIN
    RETURN QUERY 
    SELECT ar.name, ar.permissions
    FROM admin_users au
    JOIN admin_roles ar ON au.role_id = ar.id
    WHERE au.user_id = $1 AND au.is_active = true;
END;
$$ language 'plpgsql';