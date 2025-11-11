<template>
  <div class="payment-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack" content="付款确认" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 付款内容 -->
    <div v-else-if="transaction" class="payment-content">
      <!-- 订单信息 -->
      <div class="order-info-section">
        <h3>订单信息</h3>
        <el-card>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ transaction.id }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag type="warning" effect="dark">{{ transactionStore.getStatusText(transaction.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ transaction.product_name }}</el-descriptions-item>
            <el-descriptions-item label="购买数量">{{ transaction.quantity }}</el-descriptions-item>
            <el-descriptions-item label="商品价格">¥{{ transaction.product_price }}</el-descriptions-item>
            <el-descriptions-item label="订单总额">
              <span class="total-amount">¥{{ transaction.total_amount }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <!-- 卖家信息 -->
      <div class="seller-info-section">
        <h3>卖家信息</h3>
        <el-card>
          <div class="seller-content">
            <div class="seller-avatar">
              <el-avatar :size="60" :src="getSellerAvatar()">
                {{ getSellerName()?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="seller-details">
              <h4>{{ getSellerName() }}</h4>
              <p class="contact-info">
                <el-icon><Phone /></el-icon>
                请联系卖家获取联系方式
              </p>
              <p class="contact-info">
                <el-icon><Message /></el-icon>
                通过平台消息联系卖家
              </p>
              <p class="credit-info">
                <el-icon><Star /></el-icon>
                信用等级：{{ getSellerCreditLevel() }}
              </p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 支付方式选择 -->
      <div class="payment-method-section">
        <h3>选择支付方式</h3>
        <el-card>
          <el-radio-group v-model="selectedPaymentMethod" class="payment-methods">
            <el-radio label="cash" border>
              <div class="payment-method-item">
                <div class="method-icon cash">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="method-info">
                  <h4>现金交易</h4>
                  <p>面对面现金交易，安全便捷</p>
                </div>
              </div>
            </el-radio>
            
            <el-radio label="wechat" border>
              <div class="payment-method-item">
                <div class="method-icon wechat">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="method-info">
                  <h4>微信支付</h4>
                  <p>使用微信扫码支付（演示模式）</p>
                </div>
              </div>
            </el-radio>
            
            <el-radio label="alipay" border>
              <div class="payment-method-item">
                <div class="method-icon alipay">
                  <el-icon><CreditCard /></el-icon>
                </div>
                <div class="method-info">
                  <h4>支付宝</h4>
                  <p>使用支付宝扫码支付（演示模式）</p>
                </div>
              </div>
            </el-radio>
            
            <el-radio label="bank_transfer" border>
              <div class="payment-method-item">
                <div class="method-icon bank">
                  <el-icon><CreditCard /></el-icon>
                </div>
                <div class="method-info">
                  <h4>银行转账</h4>
                  <p>银行转账支付（演示模式）</p>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-card>
      </div>

      <!-- 交易备注 -->
      <div class="notes-section">
        <h3>交易备注</h3>
        <el-card>
          <el-input
            v-model="paymentNotes"
            type="textarea"
            :rows="3"
            placeholder="请输入交易备注（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-card>
      </div>

      <!-- 支付确认 -->
      <div class="payment-confirm-section">
        <el-card>
          <div class="confirm-content">
            <div class="confirm-item">
              <el-checkbox v-model="confirm1">
                我已确认商品信息无误
              </el-checkbox>
            </div>
            <div class="confirm-item">
              <el-checkbox v-model="confirm2">
                我已与卖家沟通好交易细节
              </el-checkbox>
            </div>
            <div class="confirm-item">
              <el-checkbox v-model="confirm3">
                我了解校园二手交易的风险，并同意承担相应责任
              </el-checkbox>
            </div>
            <div class="confirm-item">
              <el-checkbox v-model="confirm4">
                我同意平台的<a href="#" @click.prevent="showTerms">交易条款</a>
              </el-checkbox>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button size="large" @click="goBack">返回</el-button>
        <el-button 
          type="success" 
          size="large" 
          @click="handlePayment"
          :disabled="!canSubmit"
          :loading="submitLoading"
        >
          <el-icon><Wallet /></el-icon>
          确认付款
        </el-button>
      </div>

      <!-- 安全提示 -->
      <div class="security-tips">
        <el-alert
          title="安全交易提示"
          type="info"
          :closable="false"
          class="security-alert"
        >
          <template #default>
            <ul>
              <li>建议选择面对面交易，避免线上支付风险</li>
              <li>交易前请仔细检查商品状态</li>
              <li>保留交易凭证和沟通记录</li>
              <li>如遇问题，及时联系平台客服</li>
            </ul>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 支付成功对话框 -->
    <el-dialog
      v-model="successDialogVisible"
      title="支付成功"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <h3>付款成功！</h3>
        <p>您的订单已支付成功，请等待卖家发货。</p>
        <div class="success-details">
          <p>订单号：{{ transaction.id }}</p>
          <p>支付金额：¥{{ transaction.total_amount }}</p>
          <p>支付方式：{{ getPaymentMethodText(selectedPaymentMethod) }}</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToTransactionDetail">
          查看订单详情
        </el-button>
        <el-button @click="goToTransactionList">
          返回交易列表
        </el-button>
      </template>
    </el-dialog>

    <!-- 交易条款对话框 -->
    <el-dialog
      v-model="termsDialogVisible"
      title="交易条款"
      width="600px"
      :close-on-click-modal="true"
    >
      <div class="terms-content">
        <h4>校园二手交易平台交易条款</h4>
        <div class="terms-text">
          <p>1. 交易双方应本着诚实信用的原则进行交易。</p>
          <p>2. 买家应在付款前仔细检查商品信息。</p>
          <p>3. 卖家应保证商品描述的真实性和准确性。</p>
          <p>4. 交易完成后，双方应及时进行评价。</p>
          <p>5. 如遇交易纠纷，可向平台申诉。</p>
          <p>6. 平台仅提供交易撮合服务，不承担商品质量责任。</p>
          <p>7. 用户应遵守平台规则，维护良好交易环境。</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="termsDialogVisible = false">
          我已了解
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Wallet,
  Money,
  ChatDotRound,
  CreditCard,
  Phone,
  Message,
  Star,
  CircleCheck
} from '@element-plus/icons-vue'
import type { TransactionDetail } from '@/types/transaction'

const route = useRoute()
const router = useRouter()
const transactionStore = useTransactionStore()

// 响应式数据
const transactionId = computed(() => route.params.id as string)
const loading = ref(false)
const submitLoading = ref(false)
const selectedPaymentMethod = ref('cash')
const paymentNotes = ref('')
const successDialogVisible = ref(false)
const termsDialogVisible = ref(false)

const confirm1 = ref(false)
const confirm2 = ref(false)
const confirm3 = ref(false)
const confirm4 = ref(false)

// 计算属性
const { currentTransaction, loading: storeLoading } = storeToRefs(transactionStore)

const transaction = computed(() => currentTransaction.value)

const canSubmit = computed(() => {
  return confirm1.value && confirm2.value && confirm3.value && confirm4.value
})

// 生命周期
onMounted(async () => {
  await loadTransactionDetail()
})

// 方法
async function loadTransactionDetail() {
  try {
    loading.value = true
    await transactionStore.fetchTransactionDetail(transactionId.value)
    
    // 检查交易状态
    if (transaction.value?.status !== 'pending') {
      ElMessage.warning('该订单状态不允许付款')
      router.push(`/transactions/${transactionId.value}`)
    }
  } catch (error) {
    console.error('加载交易详情失败:', error)
    ElMessage.error('加载交易详情失败')
    router.push('/transactions')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goToTransactionDetail() {
  successDialogVisible.value = false
  router.push(`/transactions/${transactionId.value}`)
}

function goToTransactionList() {
  successDialogVisible.value = false
  router.push('/transactions')
}

function showTerms() {
  termsDialogVisible.value = true
}

async function handlePayment() {
  if (!canSubmit.value) {
    ElMessage.warning('请先确认所有选项')
    return
  }

  try {
    submitLoading.value = true
    
    // 根据支付方式显示不同的处理逻辑
    if (selectedPaymentMethod.value === 'cash') {
      // 现金交易，直接确认付款
      await processCashPayment()
    } else {
      // 其他支付方式，显示模拟支付流程
      await processOnlinePayment()
    }
    
  } catch (error) {
    console.error('付款失败:', error)
    ElMessage.error('付款失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

async function processCashPayment() {
  // 现金交易处理
  await ElMessageBox.confirm(
    '您选择现金交易方式，请与卖家约定时间和地点进行面对面交易。确认要继续吗？',
    '现金交易确认',
    {
      confirmButtonText: '确认付款',
      cancelButtonText: '取消',
      type: 'info'
    }
  )

  // 更新交易状态
  await transactionStore.updateTransactionStatus(transactionId.value, {
    status: 'paid',
    notes: `现金交易：${paymentNotes.value}`
  })

  // 显示成功对话框
  successDialogVisible.value = true
}

async function processOnlinePayment() {
  // 模拟在线支付流程
  const paymentMethodText = getPaymentMethodText(selectedPaymentMethod.value)
  
  await ElMessageBox.confirm(
    `您选择${paymentMethodText}，将跳转到支付页面进行支付（演示模式，实际不会扣款）。确认要继续吗？`,
    '支付确认',
    {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info'
    }
  )

  // 模拟支付处理
  ElMessage.info('正在跳转到支付页面...')
  
  // 模拟支付延迟
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 模拟支付成功
  ElMessage.success('支付成功！')
  
  // 更新交易状态
  await transactionStore.updateTransactionStatus(transactionId.value, {
    status: 'paid',
    notes: `${paymentMethodText}：${paymentNotes.value}`
  })

  // 显示成功对话框
  successDialogVisible.value = true
}

// 辅助函数
function getSellerName(): string {
  return transaction.value?.seller_username || '卖家'
}

function getSellerAvatar(): string {
  return transaction.value?.seller_avatar || ''
}

function getSellerCreditLevel(): string {
  // 这里应该从卖家信用信息中获取
  return 'B级'
}

function getPaymentMethodText(method: string): string {
  const methodMap: Record<string, string> = {
    'cash': '现金交易',
    'wechat': '微信支付',
    'alipay': '支付宝',
    'bank_transfer': '银行转账'
  }
  return methodMap[method] || method
}
</script>

<style scoped>
.payment-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

.payment-content > div {
  margin-bottom: 20px;
}

.payment-content h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
}

/* 订单信息 */
.total-amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

/* 卖家信息 */
.seller-content {
  display: flex;
  gap: 20px;
  align-items: center;
}

.seller-avatar {
  flex-shrink: 0;
}

.seller-details h4 {
  margin-bottom: 10px;
  color: #303133;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  margin-bottom: 5px;
  font-size: 14px;
}

.credit-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}

/* 支付方式 */
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.payment-method-item {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 10px;
}

.method-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.method-icon.cash {
  background: #67c23a;
}

.method-icon.wechat {
  background: #07c160;
}

.method-icon.alipay {
  background: #1677ff;
}

.method-icon.bank {
  background: #909399;
}

.method-info h4 {
  margin-bottom: 5px;
  color: #303133;
  font-size: 16px;
}

.method-info p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

/* 确认内容 */
.confirm-content {
  padding: 20px;
}

.confirm-item {
  margin-bottom: 15px;
}

.confirm-item:last-child {
  margin-bottom: 0;
}

.confirm-item a {
  color: #409eff;
  text-decoration: none;
}

.confirm-item a:hover {
  text-decoration: underline;
}

/* 操作按钮 */
.action-buttons {
  text-align: center;
  padding: 20px 0;
}

.action-buttons .el-button {
  margin: 0 10px;
}

/* 安全提示 */
.security-tips {
  margin-top: 30px;
}

.security-alert ul {
  margin: 10px 0;
  padding-left: 20px;
}

.security-alert li {
  margin-bottom: 5px;
  line-height: 1.6;
}

/* 成功对话框 */
.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-content h3 {
  margin-bottom: 10px;
  color: #303133;
  font-size: 20px;
}

.success-content p {
  color: #606266;
  margin-bottom: 20px;
}

.success-details {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.success-details p {
  margin-bottom: 5px;
  color: #606266;
  font-size: 14px;
}

.success-details p:last-child {
  margin-bottom: 0;
}

/* 条款内容 */
.terms-content {
  padding: 20px;
}

.terms-content h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
}

.terms-text p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #606266;
}

.terms-text p:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-container {
    padding: 15px;
  }
  
  .seller-content {
    flex-direction: column;
    text-align: center;
  }
  
  .payment-method-item {
    flex-direction: column;
    text-align: center;
  }
  
  .action-buttons .el-button {
    display: block;
    margin: 10px auto;
    width: 200px;
  }
}
</style>
