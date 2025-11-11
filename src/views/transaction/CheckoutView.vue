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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.checkout-header {
  text-align: center;
  margin-bottom: 30px;
}

.checkout-steps {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.step {
  padding: 10px 20px;
  margin: 0 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.step.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.order-section, .address-section, .payment-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 15px;
}

.item-info {
  flex: 1;
}

.item-total {
  font-weight: bold;
  color: #e74c3c;
}

.order-total {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #eee;
  font-size: 18px;
  font-weight: bold;
}

.address-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-item.selected {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
}

.payment-method input {
  margin-right: 10px;
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.address-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>