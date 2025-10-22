// 用户相关类型定义

export interface User {
  id: string
  username: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
}

export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

export interface UserProfile {
  username?: string
  email?: string
  phone?: string
  avatar?: string
}