-- 创建商品图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储桶策略：任何人都可以查看图片
CREATE POLICY "任何人都可以查看商品图片" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 设置存储桶策略：认证用户可以上传图片
CREATE POLICY "认证用户可以上传商品图片" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 设置存储桶策略：用户只能删除自己上传的图片
CREATE POLICY "用户只能删除自己上传的图片" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.uid() = owner
);

-- 创建用户头像存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 设置头像存储桶策略：任何人都可以查看头像
CREATE POLICY "任何人都可以查看用户头像" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- 设置头像存储桶策略：认证用户可以上传头像
CREATE POLICY "认证用户可以上传用户头像" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
);

-- 设置头像存储桶策略：用户只能删除自己上传的头像
CREATE POLICY "用户只能删除自己上传的头像" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid() = owner
);

-- 设置头像存储桶策略：用户只能更新自己上传的头像
CREATE POLICY "用户只能更新自己上传的头像" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid() = owner
);