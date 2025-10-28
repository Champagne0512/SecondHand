<template>
  <div class="magic-link-login">
    <el-form
      ref="magicLinkFormRef"
      :model="magicLinkForm"
      :rules="magicLinkRules"
      class="magic-link-form"
      @submit.prevent="handleMagicLinkLogin"
    >
      <el-form-item prop="email">
        <el-input
          v-model="magicLinkForm.email"
          placeholder="请输入邮箱地址"
          size="large"
          :prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          class="magic-link-button"
          :loading="isLoading"
          @click="handleMagicLinkLogin"
        >
          发送登录链接
        </el-button>
      </el-form-item>
    </el-form>

    <div class="magic-link-tips">
      <p>📧 我们将向您的邮箱发送一个登录链接</p>
      <p>🔒 无需密码，安全便捷</p>
    </div>

    <div v-if="message" class="magic-link-message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const magicLinkFormRef = ref<FormInstance>()
const isLoading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const magicLinkForm = reactive({
  email: ''
})

const magicLinkRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const handleMagicLinkLogin = async () => {
  if (!magicLinkFormRef.value) return

  try {
    await magicLinkFormRef.value.validate()
    
    isLoading.value = true
    message.value = ''
    
    // 使用Supabase的魔术链接登录
    const { error } = await userStore.loginWithMagicLink(magicLinkForm.email)
    
    if (error) {
      message.value = error
      messageType.value = 'error'
      ElMessage.error(error)
    } else {
      message.value = '登录链接已发送！请检查您的邮箱'
      messageType.value = 'success'
      ElMessage.success('登录链接已发送！请检查您的邮箱')
      
      // 清空表单
      magicLinkForm.email = ''
    }
  } catch (error) {
    console.error('魔术链接登录失败:', error)
    message.value = '发送登录链接失败，请稍后重试'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.magic-link-login {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.magic-link-form {
  margin-bottom: 20px;
}

.magic-link-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.magic-link-tips {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.magic-link-tips p {
  margin: 8px 0;
  color: #409eff;
  font-size: 14px;
  line-height: 1.5;
}

.magic-link-message {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.magic-link-message.success {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  color: #409eff;
}

.magic-link-message.error {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
}
</style>