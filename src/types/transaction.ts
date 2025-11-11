// 交易状态枚举
export enum TransactionStatus {
  PENDING = 'pending',           // 待付款
  PAID = 'paid',                 // 已付款
  SHIPPED = 'shipped',           // 已发货
  RECEIVED = 'received',         // 已收货
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled',       // 已取消
  REFUNDING = 'refunding',       // 退款中
  REFUNDED = 'refunded'          // 已退款
}

// 交易类型枚举
export enum TransactionType {
  BUY = 'buy',                   // 购买
  SELL = 'sell'                  // 出售
}

// 支付方式枚举
export enum PaymentMethod {
  CASH = 'cash',                 // 现金交易
  WECHAT = 'wechat',            // 微信支付
  ALIPAY = 'alipay',            // 支付宝
  BANK_TRANSFER = 'bank_transfer' // 银行转账
}

// 交易基础信息接口
export interface Transaction {
  id: string;
  buyer_id: string;               // 买家ID
  seller_id: string;              // 卖家ID
  product_id: string;             // 商品ID
  product_name: string;           // 商品名称
  product_price: number;          // 商品价格
  product_image?: string;         // 商品图片
  product_description?: string;   // 商品描述
  quantity: number;              // 购买数量
  total_amount: number;           // 总金额
  status: TransactionStatus;     // 交易状态
  payment_method?: PaymentMethod; // 支付方式
  notes?: string;                // 备注信息
  shipping_address?: string;      // 收货地址
  created_at: string;             // 创建时间
  updated_at: string;             // 更新时间
  paid_at?: string;               // 付款时间
  shipped_at?: string;            // 发货时间
  received_at?: string;           // 收货时间
  completed_at?: string;          // 完成时间
  cancelled_at?: string;          // 取消时间
}

// 交易详情接口（包含关联信息）
export interface TransactionDetail extends Transaction {
  buyer_username?: string;        // 买家用户名
  buyer_avatar?: string;          // 买家头像
  seller_username?: string;       // 卖家用户名
  seller_avatar?: string;         // 卖家头像
  product_images?: string[];       // 商品图片数组
  product_category?: string;      // 商品分类
  product_condition?: string;      // 商品状态
  canReview: boolean;             // 是否可以评价
  review?: TransactionReview;     // 交易评价
}

// 交易评价接口
export interface TransactionReview {
  id: string;
  transaction_id: string;         // 交易ID
  reviewer_id: string;            // 评价者ID
  reviewer_type: 'buyer' | 'seller'; // 评价者类型
  rating: number;                // 评分 (1-5)
  content: string;               // 评价内容
  images?: string[];             // 评价图片
  created_at: string;             // 创建时间
  updated_at: string;             // 更新时间
}

// 创建交易请求接口
export interface CreateTransactionRequest {
  product_id: string;             // 商品ID
  quantity: number;              // 购买数量
  notes?: string;                // 备注信息
  shipping_address?: string;      // 收货地址
}

// 更新交易状态请求接口
export interface UpdateTransactionStatusRequest {
  status: TransactionStatus;     // 新状态
  notes?: string;                // 状态变更备注
}

// 交易评价请求接口
export interface CreateTransactionReviewRequest {
  transactionId: string;         // 交易ID
  rating: number;                // 评分 (1-5)
  content: string;               // 评价内容
  images?: string[];             // 评价图片
}

// 交易筛选条件接口
export interface TransactionFilter {
  status?: TransactionStatus;    // 交易状态
  type?: TransactionType;        // 交易类型 (买入/卖出)
  startDate?: string;            // 开始日期
  endDate?: string;              // 结束日期
  keyword?: string;              // 关键词搜索
}

// 交易统计接口
export interface TransactionStats {
  totalTransactions: number;     // 总交易数
  completedTransactions: number; // 已完成交易数
  totalAmount: number;           // 总金额
  averageRating: number;         // 平均评分
  pendingTransactions: number;   // 待处理交易数
}

// 交易状态变更历史接口
export interface TransactionStatusHistory {
  id: string;
  transaction_id: string;         // 交易ID
  old_status: TransactionStatus;  // 旧状态
  new_status: TransactionStatus;  // 新状态
  changed_by: string;             // 操作者ID
  notes?: string;                // 变更备注
  created_at: string;             // 变更时间
}