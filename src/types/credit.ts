// 信用评价系统类型定义
export interface UserCreditScore {
  id: string;
  user_id: string;
  base_score: number;
  dynamic_score: number;
  overall_score: number;
  credit_level: 'A' | 'B' | 'C' | 'D' | 'E';
  total_transactions: number;
  successful_transactions: number;
  positive_reviews: number;
  negative_reviews: number;
  activity_score: number;
  response_rate: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionReview {
  id: string;
  transaction_id: string;
  product_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  communication_score: number;
  product_accuracy_score: number;
  delivery_speed_score: number;
  review_type: 'buyer_to_seller' | 'seller_to_buyer';
  is_verified: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditBehaviorLog {
  id: string;
  user_id: string;
  behavior_type: 
    | 'register' | 'complete_profile' | 'verify_email' | 'verify_phone'
    | 'publish_product' | 'successful_transaction' | 'positive_review_received'
    | 'negative_review_received' | 'quick_response' | 'late_response'
    | 'product_complaint' | 'transaction_dispute' | 'system_warning';
  description: string;
  score_change: number;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface UserCreditDetails extends UserCreditScore {
  username?: string;
  email?: string;
  avatar_url?: string;
  credit_level_description: string;
  success_rate: number;
  positive_rate: number;
}

export interface CreditLevelInfo {
  level: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  color: string;
  description: string;
  minScore: number;
  maxScore: number;
}

export const CREDIT_LEVELS: CreditLevelInfo[] = [
  { level: 'A', label: '信用极好', color: '#52c41a', description: '信用极好，交易成功率极高', minScore: 90, maxScore: 100 },
  { level: 'B', label: '信用良好', color: '#1890ff', description: '信用良好，交易可靠', minScore: 80, maxScore: 89 },
  { level: 'C', label: '信用一般', color: '#faad14', description: '信用一般，建议谨慎交易', minScore: 70, maxScore: 79 },
  { level: 'D', label: '信用较差', color: '#fa8c16', description: '信用较差，交易需特别注意', minScore: 60, maxScore: 69 },
  { level: 'E', label: '信用差', color: '#f5222d', description: '信用差，建议避免交易', minScore: 0, maxScore: 59 }
];

export interface ReviewFormData {
  rating: number;
  comment: string;
  communication_score: number;
  product_accuracy_score: number;
  delivery_speed_score: number;
}

export interface CreditStats {
  totalUsers: number;
  avgScore: number;
  levelDistribution: Record<string, number>;
  recentReviews: number;
}