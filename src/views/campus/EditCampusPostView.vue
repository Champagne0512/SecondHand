<template>
  <div class="edit-post-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>✏️ 编辑动态</h1>
        <p>修改你的校园动态内容</p>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div class="edit-form-container">
      <el-form 
        ref="editFormRef"
        :model="editForm" 
        :rules="editRules"
        label-width="100px"
        class="edit-form"
      >
        <el-form-item label="动态类型" prop="type">
          <el-select v-model="editForm.type" placeholder="选择类型">
            <el-option label="文字动态" value="text" />
            <el-option label="图片分享" value="image" />
            <el-option label="二手交易" value="trade" />
            <el-option label="活动信息" value="event" />
            <el-option label="求助信息" value="help" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="动态内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="6"
            placeholder="分享你的校园生活..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="位置">
          <el-input v-model="editForm.location" placeholder="如：图书馆、食堂、宿舍等" />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            placeholder="添加标签"
          >
            <el-option label="学习" value="学习" />
            <el-option label="生活" value="生活" />
            <el-option label="分享" value="分享" />
            <el-option label="求助" value="求助" />
            <el-option label="活动" value="活动" />
          </el-select>
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item label="动态图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :file-list="imageList"
            :before-upload="beforeImageUpload"
            :on-remove="handleImageRemove"
            :on-change="handleImageChange"
            :auto-upload="false"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">
            支持 JPG、PNG 格式，单张图片不超过 5MB
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="isSaving">
            {{ isSaving ? '保存中...' : '保存修改' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="danger" @click="handleDelete" :loading="isDeleting">
            {{ isDeleting ? '删除中...' : '删除动态' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import { useCampusStore } from '@/stores/campus'
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus'

import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const campusStore = useCampusStore()

const editFormRef = ref<FormInstance>()
const isSaving = ref(false)
const isDeleting = ref(false)
const postId = ref(route.params.id as string)

// 编辑表单
const editForm = reactive({
  type: 'text',
  content: '',
  location: '',
  tags: [] as string[]
})

// 图片列表
const imageList = ref<UploadUserFile[]>([])

// 验证规则
const editRules: FormRules = {
  type: [
    { required: true, message: '请选择动态类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入动态内容', trigger: 'blur' },
    { min: 1, max: 500, message: '动态内容长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

// 加载动态数据
const loadPostData = async () => {
  try {
    // 从store中查找动态
    const post = campusStore.campusPosts.find(p => p.id === postId.value)
    
    if (!post) {
      // 如果store中没有，从数据库查询
      const { data, error } = await supabase
        .from('campus_posts')
        .select('*')
        .eq('id', postId.value)
        .single()
      
      if (error) throw error
      
      if (!data) {
        ElMessage.error('动态不存在')
        router.back()
        return
      }
      
      // 检查权限 - 只能编辑自己的动态
      const { data: { user } } = await supabase.auth.getUser()
      if (data.user_id !== user?.id) {
        ElMessage.error('您没有权限编辑此动态')
        router.back()
        return
      }
      
      // 填充表单数据
      Object.assign(editForm, {
        type: data.type,
        content: data.content,
        location: data.location || '',
        tags: data.tags || []
      })
      
      // 处理图片
      if (data.images && data.images.length > 0) {
        imageList.value = data.images.map((url: string, index: number) => ({
          name: `image-${index}.jpg`,
          url: url
        }))
      }
    } else {
      // 检查权限 - 只能编辑自己的动态
      if (post.userId !== userStore.userInfo?.id) {
        ElMessage.error('您没有权限编辑此动态')
        router.back()
        return
      }
      
      // 填充表单数据
      Object.assign(editForm, {
        type: post.type,
        content: post.content,
        location: post.location || '',
        tags: post.tags || []
      })
      
      // 处理图片
      if (post.images && post.images.length > 0) {
        imageList.value = post.images.map((url: string, index: number) => ({
          name: `image-${index}.jpg`,
          url: url
        }))
      }
    }
  } catch (error: any) {
    console.error('加载动态数据失败:', error)
    ElMessage.error('加载动态数据失败')
    router.back()
  }
}

// 图片上传前验证
const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
    return false
  }
  
  if (rawFile.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

// 图片移除
const handleImageRemove: UploadProps['onRemove'] = (file) => {
  const index = imageList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1) {
    imageList.value.splice(index, 1)
  }
}

// 图片变化
const handleImageChange: UploadProps['onChange'] = (file) => {
  // 这里可以添加图片预览逻辑
  console.log('图片变化:', file)
}

// 保存修改
const handleSave = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    
    isSaving.value = true
    
    // 检查权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      ElMessage.error('请先登录')
      return
    }
    
    // 获取当前动态数据，验证所有权
    const { data: currentPost } = await supabase
      .from('campus_posts')
      .select('user_id')
      .eq('id', postId.value)
      .single()
    
    if (!currentPost || currentPost.user_id !== user.id) {
      ElMessage.error('您没有权限编辑此动态')
      return
    }
    
    // 准备更新数据
    const updateData = {
      type: editForm.type,
      content: editForm.content,
      location: editForm.location,
      tags: editForm.tags,
      updated_at: new Date().toISOString()
    }
    
    // 如果有新图片，需要上传图片
    if (imageList.value.some(img => img.raw)) {
      // 这里可以添加图片上传逻辑
      // 暂时只更新文本内容
    }
    
    // 更新动态
    const { error } = await supabase
      .from('campus_posts')
      .update(updateData)
      .eq('id', postId.value)
    
    if (error) throw error
    
    // 更新store中的数据
    const index = campusStore.campusPosts.findIndex(p => p.id === postId.value)
    if (index !== -1) {
      Object.assign(campusStore.campusPosts[index], {
        ...updateData,
        updatedAt: new Date().toISOString()
      })
    }
    
    ElMessage.success('动态修改成功')
    
    // 延迟返回，确保用户看到成功提示
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (error: any) {
    console.error('保存修改失败:', error)
    ElMessage.error(error.message || '保存修改失败')
  } finally {
    isSaving.value = false
  }
}

// 取消编辑
const handleCancel = () => {
  router.back()
}

// 删除动态
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此动态吗？此操作不可恢复！',
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    isDeleting.value = true
    
    // 检查权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      ElMessage.error('请先登录')
      return
    }
    
    // 获取当前动态数据，验证所有权
    const { data: currentPost } = await supabase
      .from('campus_posts')
      .select('user_id')
      .eq('id', postId.value)
      .single()
    
    if (!currentPost || currentPost.user_id !== user.id) {
      ElMessage.error('您没有权限删除此动态')
      return
    }
    
    // 删除动态
    const { error } = await supabase
      .from('campus_posts')
      .delete()
      .eq('id', postId.value)
    
    if (error) throw error
    
    // 从store中移除
    const index = campusStore.campusPosts.findIndex(p => p.id === postId.value)
    if (index !== -1) {
      campusStore.campusPosts.splice(index, 1)
    }
    
    ElMessage.success('动态删除成功')
    router.push('/profile')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      ElMessage.error(error.message || '删除动态失败')
    }
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadPostData()
})
</script>

<style scoped>
.edit-post-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.page-header {
  text-align: center;
  padding: 60px 20px 40px;
  color: white;
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: 700;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.edit-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.edit-form {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 40px 20px 30px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .edit-form-container {
    padding: 0 15px;
  }
  
  .edit-form {
    padding: 30px 25px;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.6rem;
  }
  
  .edit-form-container {
    padding: 0 10px;
  }
  
  .edit-form {
    padding: 25px 20px;
  }
}
</style>