// src/supabase.ts
// ── Replace with your Supabase credentials ──
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uojvrcksnrddiwbtrnpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvanZyY2tzbnJkZGl3YnRybnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDE4MjUsImV4cCI6MjA5NDUxNzgyNX0.QSUXnX7SAkCXyLt7B2tyBq5Kvirja4HuM2OUoBGDxXs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface Cook {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  location: string | null
  photo_url: string | null
  is_live: boolean
  is_approved: boolean
  rating: number
  total_orders: number
  dishes?: Dish[]
}

export interface Dish {
  id: string
  cook_id: string
  name: string
  name_telugu: string | null
  description: string | null
  price: number
  category: string
  photo_url: string | null
  is_available: boolean
}

export interface Order {
  id: string
  customer_id: string
  cook_id: string
  status: string
  total_amount: number
  cook_earnings: number | null
  delivery_address: string | null
  notes: string | null
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  dish_id: string
  dish_name: string
  quantity: number
  price: number
}

export interface CartItem {
  dish: Dish
  quantity: number
}
