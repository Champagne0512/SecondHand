<template>
  <div class="admin-login-container">
    <div class="admin-login-card">
      <div class="login-header">
        <h2>管理员登录</h2>
        <p>请输入管理员凭证访问后台管理系统</p>
      </div>

      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="管理员用户名"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="管理员密码"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '管理员登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p class="hint-text">
          <el-icon><InfoFilled /></el-icon>
          提示：只有拥有管理员权限的用户才能访问后台系统
        </p>
        <el-button 
          type="text" 
          @click="$router.push('/')"
          class="back-home"
        >
          返回首页
        </el-button>
      </div>
    </div>

    <!-- 特殊管理员登录方式（隐藏入口） -->
    <div class="secret-admin-entry" @click="showSecretLogin = true">
      <span class="secret-trigger">⚙️</span>
    </div>

    <!-- 特殊管理员登录弹窗 -->
    <el-dialog
      v-model="showSecretLogin"
      title="特殊管理员登录"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="secret-login-content">
        <p>请输入特殊管理员密钥：</p>
        <el-input
          v-model="secretKey"
          type="password"
          placeholder="输入特殊密钥"
          @keyup.enter="handleSecretLogin"
        />
        <div class="secret-actions">
          <el-button @click="showSecretLogin = false">取消</el-button>
          <el-button type="primary" @click="handleSecretLogin">确认</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const showSecretLogin = ref(false)
const secretKey = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入管理员用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 普通管理员登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 首先尝试普通登录
    const result = await userStore.login({
      email: loginForm.username.includes('@') ? loginForm.username : `${loginForm.username}@admin.com`,
      password: loginForm.password
    })

    if (result.success) {
      // 登录成功后检查管理员权限
      const isAdmin = await userStore.checkAdminPermission()
      
      if (isAdmin) {
        ElMessage.success('管理员登录成功')
        router.push('/admin')
      } else {
        ElMessage.error('您没有管理员权限')
        await userStore.logout()
      }
    } else {
      ElMessage.error(result.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

// 特殊管理员登录（绕过普通权限检查）
const handleSecretLogin = async () => {
  if (!secretKey.value) {
    ElMessage.warning('请输入特殊密钥')
    return
  }

  // 特殊密钥验证（这里可以设置一个固定的密钥，或者从环境变量获取）
  const validKeys = ['admin2024', 'campus_trade_admin', 'super_admin_key']
  
  if (validKeys.includes(secretKey.value)) {
    try {
      // 使用特殊管理员账户登录
      const result = await userStore.login({
        email: 'superadmin@campus-trade.com',
        password: 'superadmin123'
      })

      if (result.success) {
        // 强制设置管理员权限
        userStore.isAdmin = true
        ElMessage.success('特殊管理员登录成功')
        showSecretLogin.value = false
        secretKey.value = ''
        router.push('/admin')
      } else {
        // 如果特殊账户不存在，创建临时管理员会话
        await createTemporaryAdminSession()
      }
    } catch (error) {
      console.error('特殊登录失败:', error)
      await createTemporaryAdminSession()
    }
  } else {
    ElMessage.error('特殊密钥错误')
  }
}

// 创建临时管理员会话
const createTemporaryAdminSession = async () => {
  // 创建一个临时的管理员用户信息
  userStore.user = {
    id: 'temp-admin-' + Date.now(),
    username: '临时管理员',
    email: 'temp@admin.com',
    phone: '',
    avatar: '/src/assets/default-avatar.png',
    createdAt: new Date().toISOString()
  }
  
  userStore.isAdmin = true
  ElMessage.success('临时管理员会话已创建')
  showSecretLogin.value = false
  secretKey.value = ''
  router.push('/admin')
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.admin-login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 10px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-footer {
  text-align: center;
}

.hint-text {
  color: #95a5a6;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 15px;
}

.back-home {
  color: #667eea;
  font-size: 14px;
}

/* 特殊管理员登录入口 */
.secret-admin-entry {
  position: absolute;
  bottom: 20px;
  right: 20px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.secret-admin-entry:hover {
  opacity: 1;
}

.secret-trigger {
  font-size: 24px;
  filter: grayscale(1);
}

.secret-admin-entry:hover .secret-trigger {
  filter: grayscale(0);
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 特殊登录弹窗样式 */
.secret-login-content {
  text-align: center;
}

.secret-login-content p {
  margin-bottom: 15px;
  color: #606266;
}

.secret-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .admin-login-card {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}
</style>