<template>
  <div class="modern-login-view">
    <!-- 背景动画 -->
    <div class="background-animation">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
    
    <div class="login-container">
      <div class="modern-login-card">
        <!-- 登录头部 -->
        <div class="login-header">
          <div class="logo-section">
            <div class="logo-icon">
              <el-icon><ShoppingBag /></el-icon>
            </div>
            <h2>欢迎回来</h2>
          </div>
          <p>登录您的账户，开启二手交易之旅</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="modern-login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="email">
            <div class="input-container">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                v-model="loginForm.email"
                placeholder="请输入邮箱"
                size="large"
                class="modern-input"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-container">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                class="modern-input"
                show-password
              />
            </div>
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="loginForm.rememberMe" class="remember-checkbox">
              记住我
            </el-checkbox>
            <el-link type="primary" class="forgot-link">忘记密码？</el-link>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="modern-login-button"
              :loading="userStore.isLoading"
              @click="handleLogin"
            >
              <span v-if="!userStore.isLoading">
                <el-icon><User /></el-icon>
                立即登录
              </span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>



        <!-- 注册链接 -->
        <div class="register-section">
          <p>还没有账户？ 
            <el-link type="primary" @click="$router.push('/register')" class="register-link">
              立即注册
            </el-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  User, 
  Lock, 
  ShoppingBag,
  ChatDotRound,
  ChatLineRound 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    
    const result = await userStore.login(loginForm)
    
    if (result.success) {
      ElMessage.success({
        message: result.message,
        duration: 2000,
        showClose: true
      })
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      ElMessage.error({
        message: result.message,
        duration: 3000,
        showClose: true
      })
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请稍后重试')
  }
}
</script>

<style scoped>
.modern-login-view {
  min-height: 100vh;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 8s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.login-container {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 2;
}

.modern-login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 50px 40px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.8s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-icon {
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 12px;
  border-radius: 12px;
  margin-right: 12px;
  color: white;
  font-size: 24px;
}

.login-header h2 {
  color: #2d3748;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.login-header p {
  color: #718096;
  font-size: 16px;
  margin: 0;
}

.modern-login-form {
  margin-bottom: 30px;
}

.input-container {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  z-index: 2;
}

.modern-input {
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  transition: all 0.3s ease;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.modern-input:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.modern-input :deep(.el-input__wrapper) {
  padding-left: 45px;
  border: none;
  box-shadow: none;
  width: 100% !important;
}

.modern-input :deep(.el-input__wrapper) {
  padding-left: 45px;
  border: none;
  box-shadow: none;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-checkbox {
  color: #718096;
}

.forgot-link {
  font-size: 14px;
}

.modern-login-button {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.social-login {
  margin-bottom: 30px;
}

.divider {
  text-align: center;
  position: relative;
  margin: 20px 0;
  color: #a0aec0;
  font-size: 14px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 15px;
  position: relative;
  z-index: 1;
}

.social-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
  border-color: #667eea;
}

.wechat-btn {
  color: #07c160;
}

.qq-btn {
  color: #12b7f5;
}

.register-section {
  text-align: center;
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

.register-section p {
  color: #718096;
  font-size: 14px;
  margin: 0;
}

.register-link {
  font-weight: 600;
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modern-login-card {
    padding: 30px 20px;
    margin: 0 10px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
  
  .social-buttons {
    flex-direction: column;
  }
}
</style>