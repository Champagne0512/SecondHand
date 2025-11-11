import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { 
  UserCreditScore, 
  TransactionReview, 
  CreditBehaviorLog, 
  UserCreditDetails,
  ReviewFormData,
  CreditStats
} from '@/types/credit';

export const useCreditStore = defineStore('credit', () => {
  // 状态
  const userCredit = ref<UserCreditDetails | null>(null);
  const userReviews = ref<TransactionReview[]>([]);
  const receivedReviews = ref<TransactionReview[]>([]);
  const behaviorLogs = ref<CreditBehaviorLog[]>([]);
  const creditStats = ref<CreditStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const creditLevelInfo = computed(() => {
    if (!userCredit.value) return null;
    const level = userCredit.value.credit_level;
    const levels = [
      { level: 'A', label: '信用极好', color: '#52c41a' },
      { level: 'B', label: '信用良好', color: '#1890ff' },
      { level: 'C', label: '信用一般', color: '#faad14' },
      { level: 'D', label: '信用较差', color: '#fa8c16' },
      { level: 'E', label: '信用差', color: '#f5222d' }
    ];
    return levels.find(l => l.level === level) || levels[1];
  });

  const successRate = computed(() => {
    if (!userCredit.value) return 0;
    return userCredit.value.total_transactions > 0 
      ? (userCredit.value.successful_transactions / userCredit.value.total_transactions) * 100 
      : 0;
  });

  const positiveRate = computed(() => {
    if (!userCredit.value) return 0;
    const total = userCredit.value.positive_reviews + userCredit.value.negative_reviews;
    return total > 0 ? (userCredit.value.positive_reviews / total) * 100 : 0;
  });

  // 动作
  const fetchUserCredit = async (userId?: string) => {
    try {
      loading.value = true;
      error.value = null;

      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('用户未登录');

      // 调用数据库函数获取信用详情
      const { data, error: dbError } = await supabase
        .rpc('get_user_credit_details', { p_user_id: targetUserId });

      if (dbError) throw dbError;
      
      if (data && data.length > 0) {
        userCredit.value = data[0];
      } else {
        // 如果没有信用记录，创建默认记录
        await initializeUserCredit(targetUserId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取信用信息失败';
      console.error('获取用户信用信息失败:', err);
    } finally {
      loading.value = false;
    }
  };

  const initializeUserCredit = async (userId: string) => {
    try {
      // 调用数据库函数初始化信用记录
      const { error: dbError } = await supabase
        .rpc('update_user_credit_score', { p_user_id: userId });

      if (dbError) throw dbError;

      // 重新获取信用信息
      await fetchUserCredit(userId);
    } catch (err) {
      console.error('初始化用户信用记录失败:', err);
    }
  };

  const submitReview = async (
    transactionId: string,
    productId: string,
    reviewedUserId: string,
    reviewData: ReviewFormData,
    reviewType: 'buyer_to_seller' | 'seller_to_buyer'
  ) => {
    try {
      loading.value = true;
      error.value = null;

      const reviewerId = (await supabase.auth.getUser()).data.user?.id;
      if (!reviewerId) throw new Error('用户未登录');

      // 调用数据库函数处理评价
      const { data, error: dbError } = await supabase
        .rpc('process_transaction_review', {
          p_transaction_id: transactionId,
          p_product_id: productId,
          p_reviewer_id: reviewerId,
          p_reviewed_user_id: reviewedUserId,
          p_rating: reviewData.rating,
          p_comment: reviewData.comment,
          p_communication_score: reviewData.communication_score,
          p_product_accuracy_score: reviewData.product_accuracy_score,
          p_delivery_speed_score: reviewData.delivery_speed_score,
          p_review_type: reviewType
        });

      if (dbError) throw dbError;

      // 刷新信用信息
      await fetchUserCredit(reviewedUserId);
      
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '提交评价失败';
      console.error('提交评价失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchUserReviews = async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('用户未登录');

      const { data, error: dbError } = await supabase
        .from('transaction_reviews')
        .select('*')
        .eq('reviewer_id', targetUserId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      userReviews.value = data || [];
    } catch (err) {
      console.error('获取用户评价记录失败:', err);
    }
  };

  const fetchReceivedReviews = async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('用户未登录');

      const { data, error: dbError } = await supabase
        .from('transaction_reviews')
        .select('*')
        .eq('reviewed_user_id', targetUserId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      receivedReviews.value = data || [];
    } catch (err) {
      console.error('获取收到的评价失败:', err);
    }
  };

  const fetchBehaviorLogs = async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('用户未登录');

      const { data, error: dbError } = await supabase
        .from('credit_behavior_logs')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) throw dbError;
      behaviorLogs.value = data || [];
    } catch (err) {
      console.error('获取行为记录失败:', err);
    }
  };

  const logCreditBehavior = async (
    userId: string,
    behaviorType: CreditBehaviorLog['behavior_type'],
    description: string,
    scoreChange: number,
    relatedEntityType?: string,
    relatedEntityId?: string
  ) => {
    try {
      const { error: dbError } = await supabase
        .rpc('log_credit_behavior', {
          p_user_id: userId,
          p_behavior_type: behaviorType,
          p_description: description,
          p_score_change: scoreChange,
          p_related_entity_type: relatedEntityType,
          p_related_entity_id: relatedEntityId
        });

      if (dbError) throw dbError;
    } catch (err) {
      console.error('记录信用行为失败:', err);
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    userCredit.value = null;
    userReviews.value = [];
    receivedReviews.value = [];
    behaviorLogs.value = [];
    creditStats.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // 状态
    userCredit,
    userReviews,
    receivedReviews,
    behaviorLogs,
    creditStats,
    loading,
    error,

    // 计算属性
    creditLevelInfo,
    successRate,
    positiveRate,

    // 动作
    fetchUserCredit,
    submitReview,
    fetchUserReviews,
    fetchReceivedReviews,
    fetchBehaviorLogs,
    logCreditBehavior,
    clearError,
    reset
  };
});