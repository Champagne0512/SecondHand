-- 补充缺失的交易系统函数
-- 执行时间: 2025-11-11
-- 描述: 添加交易状态更新函数和评价功能

-- 1. 创建交易状态更新函数
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_id UUID,
  p_new_status VARCHAR(20),
  p_changed_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  current_status VARCHAR(20);
  transaction_record RECORD;
  valid_transition BOOLEAN;
BEGIN
  -- 获取当前交易状态和参与者信息
  SELECT status, buyer_id, seller_id INTO transaction_record
  FROM transactions 
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '交易不存在'::TEXT;
    RETURN;
  END IF;
  
  current_status := transaction_record.status;
  
  -- 验证状态转换是否有效
  valid_transition := CASE 
    WHEN p_new_status = 'paid' THEN current_status = 'pending'
    WHEN p_new_status = 'shipped' THEN current_status = 'paid'
    WHEN p_new_status = 'received' THEN current_status = 'shipped'
    WHEN p_new_status = 'completed' THEN current_status = 'received'
    WHEN p_new_status = 'cancelled' THEN current_status IN ('pending', 'paid')
    WHEN p_new_status = 'refunding' THEN current_status IN ('paid', 'shipped')
    WHEN p_new_status = 'refunded' THEN current_status = 'refunding'
    ELSE FALSE
  END;
  
  IF NOT valid_transition THEN
    RETURN QUERY SELECT false, '无效的状态转换'::TEXT;
    RETURN;
  END IF;
  
  -- 验证操作权限
  IF NOT (
    (p_changed_by = transaction_record.buyer_id AND 
     p_new_status IN ('paid', 'received', 'cancelled')) OR
    (p_changed_by = transaction_record.seller_id AND 
     p_new_status IN ('shipped', 'completed')) OR
    auth.role() = 'service_role'
  ) THEN
    RETURN QUERY SELECT false, '无权执行此操作'::TEXT;
    RETURN;
  END IF;
  
  -- 更新交易状态
  UPDATE transactions 
  SET status = p_new_status
  WHERE id = p_transaction_id;
  
  -- 触发器会自动记录状态历史，这里我们手动添加自定义原因
  IF p_reason IS NOT NULL THEN
    UPDATE transaction_status_history 
    SET reason = p_reason
    WHERE transaction_id = p_transaction_id
    AND to_status = p_new_status
    AND created_at = (
      SELECT MAX(created_at) 
      FROM transaction_status_history 
      WHERE transaction_id = p_transaction_id 
      AND to_status = p_new_status
    );
  END IF;
  
  RETURN QUERY SELECT true, '状态更新成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建交易评价函数（安全版本）
CREATE OR REPLACE FUNCTION create_transaction_review(
  p_transaction_id UUID,
  p_reviewer_id UUID,
  p_rating INTEGER,
  p_comment TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  review_id UUID,
  message TEXT
) AS $$
DECLARE
  transaction_record RECORD;
  review_exists BOOLEAN;
  new_review_id UUID;
  table_exists BOOLEAN;
BEGIN
  -- 检查transaction_reviews表是否存在
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'transaction_reviews'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN QUERY SELECT false, NULL::UUID, '评价功能暂不可用，请先运行基础迁移文件'::TEXT;
    RETURN;
  END IF;
  
  -- 验证交易是否存在且已完成
  SELECT buyer_id, seller_id, status INTO transaction_record
  FROM transactions 
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, '交易不存在'::TEXT;
    RETURN;
  END IF;
  
  IF transaction_record.status != 'completed' THEN
    RETURN QUERY SELECT false, NULL::UUID, '交易未完成，无法评价'::TEXT;
    RETURN;
  END IF;
  
  -- 验证评价者是否为交易参与者
  IF p_reviewer_id NOT IN (transaction_record.buyer_id, transaction_record.seller_id) THEN
    RETURN QUERY SELECT false, NULL::UUID, '无权评价此交易'::TEXT;
    RETURN;
  END IF;
  
  -- 验证评分范围
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT false, NULL::UUID, '评分必须在1-5之间'::TEXT;
    RETURN;
  END IF;
  
  -- 检查是否已经评价过
  SELECT EXISTS(
    SELECT 1 FROM transaction_reviews 
    WHERE transaction_id = p_transaction_id AND reviewer_id = p_reviewer_id
  ) INTO review_exists;
  
  IF review_exists THEN
    RETURN QUERY SELECT false, NULL::UUID, '您已经评价过此交易'::TEXT;
    RETURN;
  END IF;
  
  -- 创建评价
  INSERT INTO transaction_reviews (
    transaction_id,
    reviewer_id,
    reviewed_user_id,
    rating,
    comment
  ) VALUES (
    p_transaction_id,
    p_reviewer_id,
    CASE 
      WHEN p_reviewer_id = transaction_record.buyer_id THEN transaction_record.seller_id
      ELSE transaction_record.buyer_id
    END,
    p_rating,
    p_comment
  ) RETURNING id INTO new_review_id;
  
  RETURN QUERY SELECT true, new_review_id, '评价创建成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建用户地址管理函数（安全版本）
CREATE OR REPLACE FUNCTION create_user_address(
  p_user_id UUID,
  p_recipient_name TEXT,
  p_phone TEXT,
  p_province TEXT,
  p_city TEXT,
  p_district TEXT,
  p_detail_address TEXT,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  address_id UUID,
  message TEXT
) AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- 检查user_addresses表是否存在
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_addresses'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN QUERY SELECT false, NULL::UUID, '地址管理功能暂不可用，请先运行基础迁移文件'::TEXT;
    RETURN;
  END IF;
  
  -- 如果设置为默认地址，先取消其他默认地址
  IF p_is_default THEN
    UPDATE user_addresses 
    SET is_default = FALSE 
    WHERE user_id = p_user_id;
  END IF;
  
  -- 创建新地址
  INSERT INTO user_addresses (
    user_id,
    recipient_name,
    phone,
    province,
    city,
    district,
    detail_address,
    is_default
  ) VALUES (
    p_user_id,
    p_recipient_name,
    p_phone,
    p_province,
    p_city,
    p_district,
    p_detail_address,
    p_is_default
  ) RETURNING id INTO address_id;
  
  RETURN QUERY SELECT true, address_id, '地址创建成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建购物车结算增强函数（修复版本）
CREATE OR REPLACE FUNCTION create_transaction_from_cart_v2(
  cart_user_id UUID,
  cart_product_ids UUID[]
)
RETURNS TABLE (
  success BOOLEAN,
  transaction_id UUID,
  message TEXT
) AS $$
DECLARE
  cart_item RECORD;
  new_transaction_id UUID;
  has_output BOOLEAN := FALSE;
BEGIN
  IF cart_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, '用户未登录'::TEXT;
    RETURN;
  END IF;

  IF cart_product_ids IS NULL OR array_length(cart_product_ids, 1) = 0 THEN
    RETURN QUERY SELECT false, NULL::UUID, '未选择任何商品'::TEXT;
    RETURN;
  END IF;

  FOR cart_item IN 
    SELECT 
      sc.product_id,
      sc.quantity,
      p.seller_id,
      p.title,
      p.description,
      p.price,
      p.images,
      p.status
    FROM shopping_cart sc
    JOIN products p ON sc.product_id = p.id
    WHERE sc.user_id = cart_user_id
      AND sc.product_id = ANY(cart_product_ids)
  LOOP
    has_output := TRUE;

    IF cart_item.status <> 'available' THEN
      RETURN QUERY SELECT false, NULL::UUID, '商品 ' || cart_item.title || ' 当前不可购买'::TEXT;
      CONTINUE;
    END IF;

    IF cart_item.seller_id = cart_user_id THEN
      RETURN QUERY SELECT false, NULL::UUID, '不能购买自己的商品：' || cart_item.title::TEXT;
      CONTINUE;
    END IF;

    INSERT INTO transactions (
      buyer_id,
      seller_id,
      product_id,
      product_name,
      product_price,
      product_image,
      product_description,
      quantity,
      total_amount,
      status
    ) VALUES (
      cart_user_id,
      cart_item.seller_id,
      cart_item.product_id,
      cart_item.title,
      cart_item.price,
      COALESCE(cart_item.images[1], ''),
      cart_item.description,
      cart_item.quantity,
      cart_item.price * cart_item.quantity,
      'pending'
    ) RETURNING id INTO new_transaction_id;

    DELETE FROM shopping_cart 
    WHERE user_id = cart_user_id 
      AND product_id = cart_item.product_id;

    UPDATE products 
    SET status = 'sold',
        updated_at = NOW()
    WHERE id = cart_item.product_id;

    RETURN QUERY SELECT true, new_transaction_id, '交易创建成功'::TEXT;
  END LOOP;

  IF NOT has_output THEN
    RETURN QUERY SELECT false, NULL::UUID, '未找到可结算的商品'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 添加注释
COMMENT ON FUNCTION update_transaction_status IS '更新交易状态，验证权限和状态转换有效性';
COMMENT ON FUNCTION create_transaction_review IS '为完成的交易创建评价';
COMMENT ON FUNCTION create_user_address IS '为用户创建收货地址';
COMMENT ON FUNCTION create_transaction_from_cart_v2 IS '从购物车创建交易（增强版本）';

-- 6. 为用户地址表添加必要的索引（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
  END IF;
END $$;

-- 7. 为用户地址表添加RLS策略（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_addresses') THEN
    ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
    
    -- 用户只能查看和管理自己的地址
    DROP POLICY IF EXISTS "Users can manage their own addresses" ON user_addresses;
    CREATE POLICY "Users can manage their own addresses" ON user_addresses
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;