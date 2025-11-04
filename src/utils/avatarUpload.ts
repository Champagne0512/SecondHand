/**
 * 头像上传工具函数
 * 提供头像上传、压缩、预览等功能
 */

import { ElMessage } from 'element-plus'

/**
 * 验证图片文件
 */
export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
    return false
  }
  
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

/**
 * 压缩图片
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 计算缩放比例
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      // 设置canvas尺寸
      canvas.width = width
      canvas.height = height
      
      // 绘制图片
      ctx!.drawImage(img, 0, 0, width, height)
      
      // 转换为DataURL
      const dataUrl = canvas.toDataURL(file.type, quality)
      resolve(dataUrl)
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 生成头像文件名
 */
export const generateAvatarFileName = (userId: string, file: File): string => {
  const fileExt = file.name.split('.').pop() || 'jpg'
  return `${userId}-${Date.now()}.${fileExt}`
}

/**
 * 获取默认头像
 */
export const getDefaultAvatar = (): string => {
  return '/src/assets/default-avatar.png'
}

/**
 * 头像预览工具
 */
export class AvatarPreview {
  private previewUrl: string = ''
  
  /**
   * 创建预览
   */
  static createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      
      reader.onerror = () => {
        reject(new Error('预览创建失败'))
      }
      
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * 清理预览URL
   */
  static revokePreview(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}

/**
 * 头像上传状态管理
 */
export class AvatarUploadState {
  private isUploading = false
  private progress = 0
  
  get uploading(): boolean {
    return this.isUploading
  }
  
  get uploadProgress(): number {
    return this.progress
  }
  
  setUploading(state: boolean): void {
    this.isUploading = state
  }
  
  setProgress(progress: number): void {
    this.progress = progress
  }
  
  reset(): void {
    this.isUploading = false
    this.progress = 0
  }
}

/**
 * 头像URL处理工具
 */
export const avatarUrlUtils = {
  /**
   * 检查是否是默认头像
   */
  isDefaultAvatar(url: string): boolean {
    return !url || url.includes('default-avatar.png')
  },
  
  /**
   * 获取头像显示URL
   */
  getDisplayUrl(url: string | null | undefined): string {
    if (!url || this.isDefaultAvatar(url)) {
      return getDefaultAvatar()
    }
    return url
  },
  
  /**
   * 从URL中提取文件名
   */
  extractFileName(url: string): string | null {
    if (!url.includes('user-avatars')) return null
    return url.split('/').pop() || null
  }
}