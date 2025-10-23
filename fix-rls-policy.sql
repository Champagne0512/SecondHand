-- 修复注册功能的RLS策略
-- 这个脚本将修改profiles表的RLS策略，允许认证用户插入自己的profile

-- 1. 首先检查当前的RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. 删除现有的INSERT策略（如果存在）
DROP POLICY IF EXISTS "认证用户可以创建profile" ON profiles;

-- 3. 创建新的INSERT策略，允许认证用户插入profile
CREATE POLICY "认证用户可以创建profile" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. 验证策略是否生效
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. 测试策略：检查当前认证状态
SELECT auth.role();

-- 6. 创建一个简单的测试函数来验证插入权限
CREATE OR REPLACE FUNCTION test_profile_insert()
RETURNS TEXT AS $$
BEGIN
  -- 尝试插入一个测试profile
  INSERT INTO profiles (id, username, email, phone)
  VALUES (
    gen_random_uuid(),
    '测试用户_' || extract(epoch from now()),
    'test' || extract(epoch from now()) || '@test.com',
    '13800138000'
  );
  
  RETURN '插入成功';
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN '插入失败: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 7. 执行测试
SELECT test_profile_insert();

-- 8. 清理测试数据
DELETE FROM profiles WHERE username LIKE '测试用户_%';

-- 9. 删除测试函数
DROP FUNCTION test_profile_insert();