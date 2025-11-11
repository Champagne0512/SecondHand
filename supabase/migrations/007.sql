-- 修复 transaction_status_history 表因缺少 INSERT 策略导致的 RLS 拒绝问题
-- 允许交易参与者（或服务角色）写入状态变更记录，以配合触发器 log_transaction_status_change

-- 确保表启用了 RLS（幂等操作）
ALTER TABLE IF EXISTS transaction_status_history ENABLE ROW LEVEL SECURITY;

-- 如果之前存在同名策略，先删除以便重复执行迁移
DROP POLICY IF EXISTS "Users can insert status history for their transactions" ON transaction_status_history;

CREATE POLICY "Users can insert status history for their transactions" ON transaction_status_history
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() = changed_by
      AND EXISTS (
        SELECT 1 FROM transactions
        WHERE id = transaction_status_history.transaction_id
          AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
      )
    )
  );
