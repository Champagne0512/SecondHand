<template>
  <div class="admin-test-container">
    <div class="test-card">
      <h2>管理员权限测试</h2>
      <p>这个页面用于临时启用管理员权限，方便测试管理员后台功能。</p>
      
      <div class="test-section">
        <h3>当前权限状态</h3>
        <el-alert 
          :type="isAdmin ? 'success' : 'warning'" 
          :title="isAdmin ? '您当前是管理员' : '您当前不是管理员'"
          :description="isAdmin ? '可以访问管理员后台' : '无法访问管理员后台'"
          show-icon
          closable
        />
      </div>

      <div class="test-section">
        <h3>权限控制</h3>
        <div class="control-buttons">
          <el-button 
            type="primary" 
            @click="enableAdmin"
            :disabled="isAdmin"
          >
            <el-icon><Check /></el-icon>
            启用管理员权限
          </el-button>
          
          <el-button 
            type="danger" 
            @click="disableAdmin"
            :disabled="!isAdmin"
          >
            <el-icon><Close /></el-icon>
            禁用管理员权限
          </el-button>
          
          <el-button 
            type="success" 
            @click="goToAdmin"
            :disabled="!isAdmin"
          >
            <el-icon><Setting /></el-icon>
            进入管理员后台
          </el-button>
        </div>
      </div>

      <div class="test-section">
        <h3>测试账户</h3>
        <p>以下邮箱账户会自动被识别为管理员：</p>
        <ul class="admin-emails">
          <li>admin@campus-trade.com</li>
          <li>superadmin@campus-trade.com</li>
          <li>test@test.com</li>
        </ul>
        <p class="hint">使用这些邮箱注册或登录的用户会自动获得管理员权限。</p>
      </div>

      <div class="test-section">
        <h3>快速操作</h3>
        <div class="quick-actions">
          <el-button @click="$router.push('/')">返回首页</el-button>
          <el-button @click="$router.push('/admin/login')">管理员登录页</el-button>
          <el-button @click="refreshPage">刷新页面</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = ref(false)

// 检查当前权限状态
const checkAdminStatus = () => {
  isAdmin.value = userStore.isAdmin
}

// 启用管理员权限
const enableAdmin = () => {
  userStore.setTemporaryAdmin(true)
  isAdmin.value = true
  ElMessage.success('管理员权限已启用')
}

// 禁用管理员权限
const disableAdmin = () => {
  userStore.setTemporaryAdmin(false)
  isAdmin.value = false
  ElMessage.warning('管理员权限已禁用')
}

// 进入管理员后台
const goToAdmin = () => {
  router.push('/admin')
}

// 刷新页面
const refreshPage = () => {
  window.location.reload()
}

// 监听权限状态变化
onMounted(() => {
  checkAdminStatus()
  
  // 每2秒检查一次权限状态
  setInterval(checkAdminStatus, 2000)
})
</script>

<style scoped>
.admin-test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.test-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.test-card h2 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
}

.test-card > p {
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 30px;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h3 {
  color: #34495e;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

.control-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.control-buttons .el-button {
  flex: 1;
  min-width: 140px;
}

.admin-emails {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
}

.admin-emails li {
  padding: 5px 0;
  color: #495057;
  font-family: 'Courier New', monospace;
}

.hint {
  color: #6c757d;
  font-size: 14px;
  font-style: italic;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-card {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .control-buttons {
    flex-direction: column;
  }
  
  .control-buttons .el-button {
    width: 100%;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>