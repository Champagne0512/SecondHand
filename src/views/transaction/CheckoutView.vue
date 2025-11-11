<template>
  <div class="checkout-container">
    <div class="checkout-header">
      <h1>结算订单</h1>
      <div class="checkout-steps">
        <div class="step active">1. 确认订单</div>
        <div class="step">2. 支付</div>
        <div class="step">3. 完成</div>
      </div>
    </div>

    <div class="checkout-content">
      <!-- 订单信息 -->
      <div class="order-section">
        <h2>订单信息</h2>
        <div class="order-items">
          <div v-for="item in cartItems" :key="item.id" class="order-item">
            <img :src="item.images[0]" :alt="item.title" class="item-image" />
            <div class="item-info">
              <h3>{{ item.title }}</h3>
              <p class="price">¥{{ item.price.toFixed(2) }}</p>
              <p class="quantity">数量: {{ item.quantity }}</p>
            </div>
            <div class="item-total">
              ¥{{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
        <div class="order-total">
          <span>总计:</span>
          <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 收货地址 -->
      <div class="address-section">
        <h2>收货地址</h2>
        <div class="address-list">
          <div v-for="address in addresses" :key="address.id" 
               :class="['address-item', { 'selected': address.id === selectedAddressId }]"
               @click="selectAddress(address.id)">
            <div class="address-info">
              <p><strong>{{ address.recipient_name }}</strong> {{ address.phone }}</p>
              <p>{{ address.province }} {{ address.city }} {{ address.district }}</p>
              <p>{{ address.detail_address }}</p>
            </div>
            <div class="address-actions">
              <button @click.stop="editAddress(address)">编辑</button>
              <button @click.stop="deleteAddress(address.id)">删除</button>
            </div>
          </div>
        </div>
        <button class="add-address-btn" @click="showAddAddress = true">添加新地址</button>
      </div>

      <!-- 支付方式 -->
      <div class="payment-section">
        <h2>支付方式</h2>
        <div class="payment-methods">
          <label v-for="method in paymentMethods" :key="method.id" class="payment-method">
            <input type="radio" v-model="selectedPaymentMethod" :value="method.id" />
            <span class="method-name">{{ method.name }}</span>
            <span class="method-desc">{{ method.description }}</span>
          </label>
        </div>
      </div>

      <!-- 确认订单 -->
      <div class="confirm-section">
        <button class="confirm-btn" @click="createOrder" :disabled="!canSubmit">
          确认订单并支付
        </button>
      </div>
    </div>

    <!-- 添加/编辑地址弹窗 -->
    <div v-if="showAddAddress" class="address-modal">
      <div class="modal-content">
        <h3>{{ editingAddress ? '编辑地址' : '添加地址' }}</h3>
        <form @submit.prevent="saveAddress">
          <div class="form-group">
            <label>收货人姓名</label>
            <input v-model="addressForm.recipient_name" required />
          </div>
          <div class="form-group">
            <label>手机号码</label>
            <input v-model="addressForm.phone" required />
          </div>
          <div class="form-group">
            <label>省份</label>
            <input v-model="addressForm.province" required />
          </div>
          <div class="form-group">
            <label>城市</label>
            <input v-model="addressForm.city" required />
          </div>
          <div class="form-group">
            <label>区县</label>
            <input v-model="addressForm.district" required />
          </div>
          <div class="form-group">
            <label>详细地址</label>
            <textarea v-model="addressForm.detail_address" required></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="cancelEdit">取消</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useTransactionStore } from '@/stores/transaction'
import type { Address, PaymentMethod } from '@/stores/transaction'
import { ElMessage } from 'element-plus'

interface CartItem {
  id: string
  product_id: string
  title: string
  price: number
  quantity: number
  images: string[]
}

const router = useRouter()
const cartStore = useCartStore()
const transactionStore = useTransactionStore()

const cartItems = ref<CartItem[]>([])
const totalAmount = computed(() => {
  return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const addresses = ref<Address[]>([])
const selectedAddressId = ref<string>('')
const selectedPaymentMethod = ref<string>('alipay')

const showAddAddress = ref(false)
const editingAddress = ref<Address | null>(null)

const addressForm = ref({
  recipient_name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail_address: ''
})

const paymentMethods: PaymentMethod[] = [
  { id: 'alipay', name: '支付宝', description: '推荐使用' },
  { id: 'wechat', name: '微信支付', description: '便捷支付' },
  { id: 'balance', name: '余额支付', description: '使用账户余额' }
]

const canSubmit = computed(() => {
  return selectedAddressId.value && cartItems.value.length > 0
})

onMounted(async () => {
  await loadCheckoutItems()
  await loadAddresses()
})

async function loadCheckoutItems() {
  try {
    const checkoutItems = sessionStorage.getItem('checkoutItems')
    if (checkoutItems) {
      cartItems.value = JSON.parse(checkoutItems)
    } else {
      ElMessage.warning('未找到结算商品，请重新选择')
      router.push('/cart')
    }
  } catch (error) {
    console.error('加载结算商品失败:', error)
    ElMessage.error('加载结算商品失败')
    router.push('/cart')
  }
}

async function loadAddresses() {
  try {
    addresses.value = await transactionStore.getUserAddresses()
    if (addresses.value.length > 0) {
      selectedAddressId.value = addresses.value[0].id
    }
  } catch (error) {
    console.error('加载地址失败:', error)
  }
}

function selectAddress(addressId: string) {
  selectedAddressId.value = addressId
}

function editAddress(address: Address) {
  editingAddress.value = address
  addressForm.value = { ...address }
  showAddAddress.value = true
}

async function deleteAddress(addressId: string) {
  try {
    await transactionStore.deleteAddress(addressId)
    await loadAddresses()
  } catch (error) {
    console.error('删除地址失败:', error)
  }
}

function cancelEdit() {
  showAddAddress.value = false
  editingAddress.value = null
  addressForm.value = {
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: ''
  }
}

async function saveAddress() {
  try {
    if (editingAddress.value) {
      await transactionStore.updateAddress(editingAddress.value.id, addressForm.value)
    } else {
      await transactionStore.createAddress(addressForm.value)
    }
    await loadAddresses()
    cancelEdit()
  } catch (error) {
    console.error('保存地址失败:', error)
  }
}

async function createOrder() {
  if (!canSubmit.value) return

  try {
    const productIds = cartItems.value.map(item => item.product_id)
    
    // 使用交易store创建订单
    const transactionId = await transactionStore.createTransactionFromCart(productIds)
    
    if (transactionId) {
      // 清空购物车中的已结算商品
      await cartStore.batchRemoveFromCart(productIds)
      
      // 清空sessionStorage
      sessionStorage.removeItem('checkoutItems')
      
      ElMessage.success('订单创建成功！')
      
      // 跳转到交易详情页面
      router.push(`/transaction/${transactionId}`)
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    ElMessage.error('创建订单失败，请重试')
  }
}
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.checkout-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.checkout-header h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.checkout-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  position: relative;
}

.step {
  padding: 12px 30px;
  margin: 0 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 25px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.step.active {
  background: rgba(255,255,255,0.9);
  color: #667eea;
  border-color: rgba(255,255,255,0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.checkout-steps::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  z-index: 1;
}

.checkout-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.order-section, .address-section, .payment-section {
  margin-bottom: 40px;
  padding: 30px;
  border: none;
  border-radius: 15px;
  background: #f8f9fa;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.order-section:hover, .address-section:hover, .payment-section:hover {
  transform: translateY(-2px);
}

.order-section h2, .address-section h2, .payment-section h2 {
  font-size: 1.5rem;
  margin-bottom: 25px;
  color: #2c3e50;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
  font-weight: 600;
}

.order-items {
  space-y: 20px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: none;
  border-radius: 12px;
  background: white;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.order-item:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}

.item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  margin-right: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.item-info {
  flex: 1;
}

.item-info h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
}

.price {
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.quantity {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.item-total {
  font-weight: 700;
  color: #e74c3c;
  font-size: 1.3rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 2px solid #ecf0f1;
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
}

.total-amount {
  color: #e74c3c;
  font-size: 1.6rem;
}

.address-list {
  space-y: 15px;
}

.address-item {
  padding: 20px;
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  margin-bottom: 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  transition: all 0.3s ease;
}

.address-item:hover {
  border-color: #bdc3c7;
  transform: translateY(-1px);
}

.address-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea20, #764ba220);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.address-info p {
  margin: 5px 0;
  color: #2c3e50;
}

.address-info p:first-child {
  font-weight: 600;
  font-size: 1.1rem;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.address-actions button {
  padding: 8px 16px;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  background: white;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.address-actions button:hover {
  background: #f8f9fa;
  border-color: #95a5a6;
}

.add-address-btn {
  width: 100%;
  padding: 15px;
  border: 2px dashed #bdc3c7;
  border-radius: 12px;
  background: transparent;
  color: #7f8c8d;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
}

.add-address-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.payment-methods {
  space-y: 12px;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  background: white;
  transition: all 0.3s ease;
}

.payment-method:hover {
  border-color: #bdc3c7;
  transform: translateY(-1px);
}

.payment-method input {
  margin-right: 15px;
  transform: scale(1.2);
}

.method-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-right: 10px;
}

.method-desc {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.confirm-section {
  margin-top: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  text-align: center;
}

.confirm-btn {
  width: 100%;
  padding: 20px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0,0,0,0.3);
}

.confirm-btn:disabled {
  background: #bdc3c7;
  color: #7f8c8d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.address-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content h3 {
  font-size: 1.5rem;
  margin-bottom: 25px;
  color: #2c3e50;
  text-align: center;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.form-actions button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-actions button[type="button"] {
  background: #ecf0f1;
  color: #7f8c8d;
}

.form-actions button[type="submit"] {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.form-actions button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>