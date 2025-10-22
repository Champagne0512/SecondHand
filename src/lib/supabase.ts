import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://yxrpcnrcptilmqfvfatd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cnBjbnJjcHRpbG1xZnZmYXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDM1NDAsImV4cCI6MjA3NjY3OTU0MH0.kwamkHcn7ghEvQP5lQcHiK4I1FCF7F_z141z2ushBGo'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 导出类型定义
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          original_price: number | null
          category: string
          images: string[]
          condition: string
          seller_id: string
          status: 'available' | 'sold' | 'pending'
          location: string
          contact_info: string
          created_at: string
          updated_at: string
          view_count: number
          like_count: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          original_price?: number | null
          category: string
          images: string[]
          condition: string
          seller_id: string
          status?: 'available' | 'sold' | 'pending'
          location: string
          contact_info: string
          created_at?: string
          updated_at?: string
          view_count?: number
          like_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          original_price?: number | null
          category?: string
          images?: string[]
          condition?: string
          seller_id?: string
          status?: 'available' | 'sold' | 'pending'
          location?: string
          contact_info?: string
          created_at?: string
          updated_at?: string
          view_count?: number
          like_count?: number
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          product_id: string
          buyer_id: string
          seller_id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          buyer_id: string
          seller_id: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          buyer_id?: string
          seller_id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}