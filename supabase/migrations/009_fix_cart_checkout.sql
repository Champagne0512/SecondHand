-- 修复 create_transaction_from_cart 函数引用不存在列的问题，并确保购物车结算流程可用

CREATE OR REPLACE FUNCTION create_transaction_from_cart(
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
