<template>
  <div class="campus-posts-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>💬 校园动态</h1>
        <p>分享校园生活，连接同学情谊</p>
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          <el-icon><Plus /></el-icon>
          发布动态
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-select v-model="filters.postType" placeholder="动态类型" @change="handleFilterChange">
            <el-option label="全部动态" value="all" />
            <el-option label="文字动态" value="text" />
            <el-option label="图片分享" value="image" />
            <el-option label="二手交易" value="trade" />
            <el-option label="活动信息" value="event" />
            <el-option label="求助信息" value="help" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索动态内容..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 动态列表 -->
    <div class="posts-container">
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredPosts.length > 0" class="posts-list">
        <div 
          v-for="post in filteredPosts" 
          :key="post.id" 
          class="post-card"
        >
          <!-- 用户信息 -->
          <div class="post-header">
            <div class="user-info">
              <el-avatar :src="post.userAvatar" :size="40" />
              <div class="user-details">
                <span class="username">{{ post.username }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
            </div>
            <el-tag :type="getPostTypeTag(post.type)" size="small">
              {{ getPostTypeLabel(post.type) }}
            </el-tag>
          </div>

          <!-- 动态内容 -->
          <div class="post-content">
            <p class="post-text">{{ post.content }}</p>
            
            <!-- 图片展示 -->
            <div v-if="post.images && post.images.length > 0" class="post-images">
              <el-image
                v-for="(image, index) in post.images"
                :key="index"
                :src="image"
                :preview-src-list="post.images"
                :initial-index="index"
                fit="cover"
                class="post-image"
                @click="previewImage(image, post.images)"
              />
            </div>

            <!-- 位置和标签 -->
            <div v-if="post.location || (post.tags && post.tags.length > 0)" class="post-meta">
              <span v-if="post.location" class="location">📍 {{ post.location }}</span>
              <div v-if="post.tags && post.tags.length > 0" class="tags">
                <el-tag
                  v-for="tag in post.tags"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 互动按钮 -->
          <div class="post-actions">
            <el-button 
              :type="post.isLiked ? 'danger' : 'default'"
              size="small"
              :icon="post.isLiked ? 'el-icon-star-on' : 'el-icon-star-off'"
              @click="toggleLike(post)"
            >
              {{ post.likes }} 点赞
            </el-button>
            
            <el-button 
              type="default"
              size="small"
              icon="el-icon-chat-dot-round"
              @click="showComments(post)"
            >
              {{ post.comments }} 评论
            </el-button>
            
            <el-button 
              type="default"
              size="small"
              icon="el-icon-share"
              @click="sharePost(post)"
            >
              分享
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无校园动态，快来发布第一条动态吧！" />
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          发布动态
        </el-button>
      </div>
    </div>

    <!-- 发布动态对话框 -->
    <el-dialog
      v-model="showPublishDialog"
      title="发布校园动态"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="动态类型">
          <el-select v-model="publishForm.type" placeholder="选择类型">
            <el-option label="文字动态" value="text" />
            <el-option label="图片分享" value="image" />
            <el-option label="二手交易" value="trade" />
            <el-option label="活动信息" value="event" />
            <el-option label="求助信息" value="help" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="动态内容">
          <el-input
            v-model="publishForm.content"
            type="textarea"
            :rows="4"
            placeholder="分享你的校园生活..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="位置">
          <el-input v-model="publishForm.location" placeholder="如：图书馆、食堂、宿舍等" />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="publishForm.tags"
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
            支持 JPG、PNG 格式，单张图片不超过 5MB，最多可上传 9 张图片
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="publishPost" :loading="isUploading">
            {{ isUploading ? '发布中...' : '发布' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评论对话框 -->
    <el-dialog
      v-model="showCommentsDialog"
      :title="`评论 - ${currentPost?.content?.substring(0, 30)}...`"
      width="700px"
      :before-close="handleCloseCommentsDialog"
    >
      <!-- 排序选项 -->
      <div class="sort-options">
        <el-radio-group v-model="commentSortType" @change="handleSortChange">
          <el-radio-button label="time">时间排序</el-radio-button>
          <el-radio-button label="likes">点赞排序</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="commentSortDirection" @change="handleSortChange">
          <el-radio-button label="desc">{{ getSortDirectionLabel() }}</el-radio-button>
          <el-radio-button label="asc">{{ getSortDirectionLabel(true) }}</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 评论列表 -->
      <div class="comments-section">
        <div v-if="comments.length > 0" class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <div class="comment-header">
              <el-avatar :src="comment.userAvatar" :size="32" />
              <div class="comment-user">
                <span class="username">{{ comment.username }}</span>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <el-button 
                :type="comment.isLiked ? 'danger' : 'default'"
                size="small"
                @click="toggleCommentLike(comment)"
              >
                <el-icon><Star /></el-icon>
                {{ comment.likes }}
              </el-button>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
        </div>
        <div v-else class="empty-comments">
          <el-empty description="暂无评论，快来发表第一条评论吧！" />
        </div>
      </div>

      <!-- 发表评论 -->
      <div class="add-comment">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
          maxlength="200"
          show-word-limit
        />
        <div class="comment-actions">
          <el-button @click="handleCloseCommentsDialog">取消</el-button>
          <el-button type="primary" @click="addComment" :disabled="!newComment.trim()">
            发表评论
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCampusStore } from '@/stores/campus'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { UploadProps, UploadUserFile } from 'element-plus'

import { Plus, Search, Star } from '@element-plus/icons-vue'

const campusStore = useCampusStore()

// 状态
const searchKeyword = ref('')
const showPublishDialog = ref(false)
const showCommentsDialog = ref(false)
const currentPost = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const filters = ref({
  postType: 'all'
})

// 评论排序状态
const commentSortType = ref<'time' | 'likes'>('time')
const commentSortDirection = ref<'asc' | 'desc'>('desc')

const publishForm = ref({
  type: 'text' as 'text' | 'image' | 'trade' | 'event' | 'help',
  content: '',
  location: '',
  tags: [] as string[]
})

// 图片上传相关
const imageList = ref<UploadUserFile[]>([])
const isUploading = ref(false)

// 计算属性
const filteredPosts = computed(() => {
  let posts = campusStore.filteredPosts
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    posts = posts.filter(post => 
      post.content.toLowerCase().includes(keyword) ||
      post.username.toLowerCase().includes(keyword) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(keyword)))
    )
  }
  
  return posts
})

// 生命周期
onMounted(async () => {
  await campusStore.getCampusPosts(20)
})

// 方法
const handleFilterChange = () => {
  campusStore.updateFilters({ postType: filters.value.postType })
}

const handleSearch = () => {
  // 搜索功能已在计算属性中实现
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
  
  // 检查图片数量限制
  if (imageList.value.length >= 9) {
    ElMessage.error('最多只能上传 9 张图片')
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
const handleImageChange: UploadProps['onChange'] = (file, fileList) => {
  console.log('图片变化:', file, '文件列表:', fileList)
  
  // 更新imageList，确保包含所有已选择的文件
  imageList.value = fileList.map(f => ({
    ...f,
    // 确保每个文件都有uid和raw属性
    uid: f.uid || `file-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    raw: f.raw || f
  }))
  
  console.log('更新后的imageList:', imageList.value)
}

// 检查存储桶是否存在，如果不存在则使用备用存储桶
const checkStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName)
    if (error) {
      console.warn(`存储桶 ${bucketName} 不存在或无法访问:`, error.message)
      
      // 检查是否有可用的备用存储桶
      const availableBuckets = ['product-images', 'user-avatars']
      for (const backupBucket of availableBuckets) {
        const { data: backupData, error: backupError } = await supabase.storage.getBucket(backupBucket)
        if (!backupError) {
          console.log(`使用备用存储桶: ${backupBucket}`)
          return true // 返回true表示有可用的存储桶
        }
      }
      
      console.error('没有可用的存储桶，请管理员配置存储桶')
      return false
    }
    console.log(`存储桶 ${bucketName} 存在:`, data)
    return true
  } catch (error: any) {
    console.error(`检查存储桶 ${bucketName} 失败:`, error)
    return false
  }
}

// 上传图片到Supabase
const uploadImages = async (files: UploadUserFile[]): Promise<string[]> => {
  const uploadedUrls: string[] = []
  let bucketName = 'campus-posts'
  
  // 检查存储桶是否存在
  const bucketExists = await checkStorageBucket(bucketName)
  if (!bucketExists) {
    console.warn(`存储桶 ${bucketName} 不存在，尝试使用备用存储桶`)
    
    // 尝试使用备用存储桶
    const availableBuckets = ['product-images', 'user-avatars']
    let foundBucket = false
    
    for (const backupBucket of availableBuckets) {
      const { data: backupData, error: backupError } = await supabase.storage.getBucket(backupBucket)
      if (!backupError) {
        bucketName = backupBucket
        foundBucket = true
        console.log(`使用备用存储桶: ${bucketName}`)
        break
      }
    }
    
    if (!foundBucket) {
      console.error('没有可用的存储桶，请管理员配置存储桶')
      throw new Error(`存储桶 ${bucketName} 不存在，请联系管理员配置存储桶`)
    }
  }
  
  for (const file of files) {
    if (!file.raw) continue
    
    try {
      // 生成唯一文件名
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `campus-posts/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      
      console.log(`开始上传图片到存储桶 ${bucketName}:`, fileName)
      
      // 上传到Supabase存储桶
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.raw)
      
      if (error) {
        console.error('图片上传错误详情:', error)
        throw new Error(`图片上传失败: ${error.message}`)
      }
      
      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)
      
      console.log('图片上传成功:', { fileName, publicUrl })
      uploadedUrls.push(publicUrl)
    } catch (error: any) {
      console.error('图片上传失败:', error)
      throw new Error(`图片上传失败: ${error.message}`)
    }
  }
  
  return uploadedUrls
}

const publishPost = async () => {
  if (!publishForm.value.content.trim()) {
    ElMessage.warning('请输入动态内容')
    return
  }
  
  isUploading.value = true
  
  try {
    let imageUrls: string[] = []
    
    // 如果有图片需要上传
    if (imageList.value.length > 0) {
      ElMessage.info('正在上传图片...')
      console.log('开始上传图片，数量:', imageList.value.length)
      
      try {
        imageUrls = await uploadImages(imageList.value)
        console.log('图片上传完成，URLs:', imageUrls)
      } catch (uploadError: any) {
        console.error('图片上传失败:', uploadError)
        ElMessage.error(`图片上传失败: ${uploadError.message}`)
        return
      }
    }
    
    console.log('准备发布动态，图片URLs:', imageUrls)
    
    // 发布动态，包含图片URL
    const result = await campusStore.publishCampusPost({
      ...publishForm.value,
      images: imageUrls
    })
    
    console.log('发布结果:', result)
    
    if (result.success) {
      ElMessage.success('动态发布成功！')
      showPublishDialog.value = false
      resetPublishForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error: any) {
    console.error('发布动态失败:', error)
    ElMessage.error(error.message || '发布失败，请稍后重试')
  } finally {
    isUploading.value = false
  }
}

const toggleLike = async (post: any) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    // 首先检查用户是否已经点赞过
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw checkError
    }

    if (existingLike) {
      // 取消点赞
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // 更新本地状态
      post.likes = Math.max(0, post.likes - 1)
      post.isLiked = false
      ElMessage.success('取消点赞')
    } else {
      // 点赞
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: post.id,
          user_id: user.id
        })

      if (error) throw error
      
      // 更新本地状态
      post.likes += 1
      post.isLiked = true
      ElMessage.success('点赞成功')
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

const showComments = async (post: any) => {
  currentPost.value = post
  showCommentsDialog.value = true
  await loadComments(post.id)
}

const loadComments = async (postId: string) => {
  try {
    // 获取当前用户ID（如果已登录）
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // 构建排序参数 - 支持正序和倒序排列
    let orderBy = 'created_at'
    let ascending = commentSortDirection.value === 'asc' // 根据方向设置排序
    
    if (commentSortType.value === 'likes') {
      orderBy = 'likes'
      ascending = commentSortDirection.value === 'asc' // 根据方向设置排序
    }

    // 先查询评论数据
    const { data: commentsData, error: commentsError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order(orderBy, { ascending: ascending })

    if (commentsError) throw commentsError

    console.log('加载的评论数据:', commentsData)

    if (!commentsData || commentsData.length === 0) {
      comments.value = []
      return
    }

    // 获取所有用户ID
    const userIds = [...new Set(commentsData.map(comment => comment.user_id))]
    
    // 查询用户信息
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)

    if (usersError) {
      console.warn('获取用户信息失败，使用默认信息:', usersError.message)
    }

    // 如果有用户登录，查询评论点赞状态
    let commentLikesMap = new Map()
    if (currentUserId) {
      const commentIds = commentsData.map(comment => comment.id)
      if (commentIds.length > 0) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUserId)
          .in('comment_id', commentIds)
        
        if (likesData) {
          likesData.forEach(like => {
            commentLikesMap.set(like.comment_id, true)
          })
        }
      }
    }

    // 创建用户信息映射
    const userMap = new Map()
    if (usersData) {
      usersData.forEach(user => {
        userMap.set(user.id, {
          username: user.username || '匿名用户',
          avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        })
      })
    }

    // 处理评论数据
    comments.value = commentsData.map(comment => {
      const userInfo = userMap.get(comment.user_id) || {
        username: '匿名用户',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }

      return {
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        username: userInfo.username,
        userAvatar: userInfo.avatar_url,
        content: comment.content,
        likes: comment.likes || 0,
        isLiked: commentLikesMap.has(comment.id) || false,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      }
    })

    console.log('处理后的评论列表:', comments.value)
  } catch (error) {
    console.error('加载评论失败:', error)
    comments.value = []
  }
}

// 排序变更处理
const handleSortChange = () => {
  if (currentPost.value) {
    loadComments(currentPost.value.id)
  }
}

// 获取排序方向标签
const getSortDirectionLabel = (isAsc = false) => {
  const direction = isAsc ? 'asc' : commentSortDirection.value
  if (commentSortType.value === 'time') {
    return direction === 'desc' ? '最新在前' : '最早在前'
  } else {
    return direction === 'desc' ? '最多在前' : '最少在前'
  }
}

const addComment = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }

  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    // 先获取当前用户信息
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: currentPost.value.id,
        user_id: user.id,
        content: newComment.value.trim()
      })
      .select()
      .single()

    if (error) throw error

    // 添加到本地列表，使用真实的用户信息
    comments.value.unshift({
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      username: userProfile?.username || '当前用户',
      userAvatar: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      content: data.content,
      likes: 0,
      isLiked: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })

    // 更新帖子评论数
    currentPost.value.comments += 1
    
    newComment.value = ''
    ElMessage.success('评论发表成功')
  } catch (error: any) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表失败，请稍后重试')
  }
}

const toggleCommentLike = async (comment: any) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    // 首先检查用户是否已经点赞过
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', comment.id)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw checkError
    }

    if (existingLike) {
      // 取消点赞
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // 更新本地状态
      comment.likes = Math.max(0, comment.likes - 1)
      comment.isLiked = false
      ElMessage.success('取消点赞')
    } else {
      // 点赞
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: comment.id,
          user_id: user.id
        })

      if (error) throw error
      
      // 更新本地状态
      comment.likes += 1
      comment.isLiked = true
      ElMessage.success('点赞成功')
    }
  } catch (error: any) {
    console.error('评论点赞操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

const handleCloseCommentsDialog = () => {
  showCommentsDialog.value = false
  currentPost.value = null
  comments.value = []
  newComment.value = ''
  // 重置排序状态为默认值
  commentSortType.value = 'time'
  commentSortDirection.value = 'desc'
}

const sharePost = (post: any) => {
  // 实现分享功能
  if (navigator.share) {
    navigator.share({
      title: '校园动态',
      text: post.content,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  }
}

const previewImage = (image: string, images: string[]) => {
  // Element Plus的el-image组件已经内置了预览功能
}

const handleCloseDialog = () => {
  resetPublishForm()
  showPublishDialog.value = false
}

const resetPublishForm = () => {
  publishForm.value = {
    type: 'text' as 'text' | 'image' | 'trade' | 'event' | 'help',
    content: '',
    location: '',
    tags: [] as string[]
  }
  imageList.value = []
}

const getPostTypeTag = (type: string) => {
  const tagMap = {
    text: 'info',
    image: 'success',
    trade: 'warning',
    event: 'primary',
    help: 'danger'
  }
  return tagMap[type as keyof typeof tagMap] || 'info'
}

const getPostTypeLabel = (type: string) => {
  const labelMap = {
    text: '文字',
    image: '图片',
    trade: '交易',
    event: '活动',
    help: '求助'
  }
  return labelMap[type as keyof typeof labelMap] || type
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.campus-posts-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
  animation: fadeInUp 0.8s ease-out;
}

.page-header {
  text-align: center;
  padding: 80px 20px 60px;
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  animation: pulse 3s ease-in-out infinite;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  font-size: 3.5rem;
  margin-bottom: 15px;
  font-weight: 800;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: slideInLeft 0.8s ease-out 0.2s both;
}

.header-content p {
  font-size: 1.3rem;
  opacity: 0.9;
  margin-bottom: 25px;
  animation: slideInLeft 0.8s ease-out 0.4s both;
}

.filter-section {
  max-width: 800px;
  margin: 0 auto 50px;
  padding: 0 20px;
}

.posts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  text-align: center;
  padding: 80px 0;
}

.posts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
  gap: 25px;
}

.post-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c, #f56c6c);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 20px 60px rgba(0, 0, 0, 0.1);
}

.post-card:hover::before {
  transform: scaleX(1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 1.1rem;
}

.post-time {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.post-content {
  margin-bottom: 25px;
}

.post-text {
  color: #444;
  line-height: 1.7;
  margin-bottom: 20px;
  font-size: 1rem;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.post-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-image:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.location {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.tags {
  display: flex;
  gap: 10px;
}

.post-actions {
  display: flex;
  gap: 20px;
  padding-top: 25px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .posts-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

@media (max-width: 992px) {
  .header-content h1 {
    font-size: 2.8rem;
  }
  
  .filter-section {
    padding: 0 15px;
    margin: 0 auto 40px;
  }
}

@media (max-width: 768px) {
  .campus-posts-view {
    padding: 15px 0;
  }
  
  .page-header {
    padding: 60px 20px 40px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
  }
  
  .header-content p {
    font-size: 1.1rem;
  }
  
  .filter-section {
    padding: 0 10px;
    margin: 0 auto 30px;
  }
  
  .posts-list {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .post-card {
    padding: 25px 20px;
  }
  
  .post-images {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .filter-section {
    padding: 0 5px;
    margin: 0 auto 25px;
  }
  
  .post-card {
    padding: 20px 15px;
  }
  
  .post-images {
    grid-template-columns: 1fr;
  }
}


/* 排序选项样式 */
.sort-options {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.sort-options .el-radio-group {
  display: flex;
  gap: 8px;
}

.sort-options .el-radio-button {
  --el-radio-button-checked-bg-color: #409eff;
  --el-radio-button-checked-text-color: #fff;
  --el-radio-button-checked-border-color: #409eff;
}

/* 响应式设计 - 排序选项 */
@media (max-width: 768px) {
  .sort-options {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .sort-options .el-radio-group {
    justify-content: center;
  }
  
  .sort-options .el-radio-button {
    flex: 1;
    text-align: center;
  }
}

/* 评论对话框样式 */
.comments-section {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-user {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.comment-user .username {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.comment-user .comment-time {
  font-size: 0.8rem;
  color: #666;
}

.comment-content {
  color: #444;
  line-height: 1.5;
  font-size: 0.9rem;
}

.empty-comments {
  text-align: center;
  padding: 40px 0;
}

.add-comment {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

/* 滚动条样式 */
.comments-section::-webkit-scrollbar {
  width: 6px;
}

.comments-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comments-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.comments-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 图片上传样式 */
.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* 图片上传卡片样式 */
:deep(.el-upload--picture-card) {
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

:deep(.el-upload--picture-card:hover) {
  border-color: #409eff;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-upload-list--picture-card .el-upload-list__item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>