# 头像上传功能使用指南

## 功能概述

本项目已经实现了完整的头像上传功能，支持以下特性：

- ✅ 头像上传到 Supabase 存储
- ✅ 图片格式验证 (JPG, PNG, GIF, WebP)
- ✅ 文件大小限制 (最大 5MB)
- ✅ 自动压缩图片
- ✅ 实时预览
- ✅ 删除旧头像
- ✅ 错误处理和用户提示

## 手动配置步骤

### 1. 创建 Supabase 存储桶

在 Supabase 控制台中创建头像存储桶：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Storage** → **Buckets**
4. 点击 **New Bucket**
5. 填写以下信息：
   - **Bucket Name**: `user-avatars`
   - **Public**: ✅ 勾选（允许公开访问头像）
6. 点击 **Create Bucket**

### 2. 执行存储桶配置脚本

运行以下 SQL 脚本创建存储策略：

```sql
-- 在 Supabase SQL Editor 中执行以下脚本
-- 或者运行项目中的 supabase/storage/create_buckets.sql
```

## 使用方法

### 1. 在用户个人资料页面使用

头像上传功能已经集成到 `src/views/user/ProfileView.vue` 中：

```vue
<el-form-item label="头像">
  <el-upload
    action="#"
    :show-file-list="false"
    :before-upload="beforeAvatarUpload"
  >
    <el-avatar :size="100" :src="profileForm.avatar" />
    <template #tip>
      <div class="avatar-tip">点击头像更换</div>
    </template>
  </el-upload>
</el-form-item>
```

### 2. 在其他组件中使用

在其他需要头像上传的地方，可以使用头像上传工具函数：

```typescript
import { useUserStore } from '@/stores/user'
import { validateImageFile, AvatarPreview } from '@/utils/avatarUpload'

const userStore = useUserStore()

// 处理头像上传
const handleAvatarUpload = async (file: File) => {
  try {
    // 验证文件
    if (!validateImageFile(file)) return
    
    // 创建预览
    const previewUrl = await AvatarPreview.createPreview(file)
    
    // 上传到 Supabase
    const avatarUrl = await userStore.uploadAvatar(file)
    
    // 更新用户信息
    await userStore.updateProfile({ avatar: avatarUrl })
    
  } catch (error) {
    console.error('头像上传失败:', error)
  }
}
```

## API 参考

### User Store 方法

#### `uploadAvatar(file: File): Promise<string>`

上传头像到 Supabase 存储。

**参数：**
- `file`: 图片文件对象

**返回值：**
- `Promise<string>`: 上传后的头像 URL

**示例：**
```typescript
const avatarUrl = await userStore.uploadAvatar(file)
```

#### `deleteOldAvatar(avatarUrl: string): Promise<void>`

删除旧的用户头像。

**参数：**
- `avatarUrl`: 要删除的头像 URL

#### `updateProfile(profile: Partial<User>): Promise<{success: boolean, message: string}>`

更新用户个人信息，包括头像。

### 工具函数

#### `validateImageFile(file: File): boolean`

验证图片文件格式和大小。

#### `compressImage(file: File, maxWidth?: number, maxHeight?: number, quality?: number): Promise<string>`

压缩图片文件。

#### `AvatarPreview.createPreview(file: File): Promise<string>`

创建图片预览。

#### `avatarUrlUtils.getDisplayUrl(url: string | null | undefined): string`

获取头像显示 URL，处理默认头像。

## 错误处理

头像上传过程中可能遇到的错误：

1. **文件格式错误** - 只支持 JPG、PNG、GIF、WebP 格式
2. **文件大小超限** - 最大 5MB
3. **网络错误** - 上传失败
4. **权限错误** - 用户未登录或权限不足

所有错误都会通过 ElMessage 提示用户。

## 存储结构

头像文件存储在 Supabase 的 `user-avatars` 存储桶中，文件命名规则为：

```
{user-id}-{timestamp}.{extension}
```

例如：`88e123ae-d36a-486a-9971-9b42c6301a99-1634567890123.jpg`

## 性能优化

1. **图片压缩**: 自动压缩大图片到 800x800 像素
2. **缓存控制**: 设置 1 小时缓存
3. **懒加载**: 头像按需加载
4. **旧文件清理**: 自动删除被替换的旧头像

## 安全考虑

1. **文件验证**: 严格验证文件类型和大小
2. **权限控制**: 只有认证用户可以上传头像
3. **文件名安全**: 使用用户 ID 和时间戳防止文件名冲突
4. **存储隔离**: 头像存储桶与商品图片存储桶分离

## 测试建议

测试头像上传功能时，建议：

1. 测试不同格式的图片文件
2. 测试超过 5MB 的大文件
3. 测试网络中断情况
4. 测试未登录用户的上传权限
5. 测试头像显示和更新是否及时

## 常见问题

### Q: 头像上传失败怎么办？
A: 检查网络连接，确认文件格式和大小符合要求。

### Q: 如何更换默认头像？
A: 替换 `src/assets/default-avatar.png` 文件。

### Q: 头像上传后不显示？
A: 检查 Supabase 存储桶的公开权限设置。

### Q: 如何限制头像尺寸？
A: 在 `compressImage` 函数中调整 `maxWidth` 和 `maxHeight` 参数。

## 技术支持

如果遇到问题，请检查：

1. Supabase 项目配置
2. 存储桶权限设置
3. 网络连接状态
4. 浏览器控制台错误信息