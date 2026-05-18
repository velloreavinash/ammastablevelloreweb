// src/CartContext.tsx
import React, { createContext, useContext, useState } from 'react'
import { Dish, CartItem } from './supabase'

interface CartContextType {
  items: CartItem[]
  cookId: string | null
  cookName: string | null
  addItem: (dish: Dish, cookId: string, cookName: string) => void
  removeItem: (dishId: string) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType>({
  items: [], cookId: null, cookName: null,
  addItem: () => {}, removeItem: () => {}, clearCart: () => {},
  total: 0, count: 0,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cookId, setCookId] = useState<string | null>(null)
  const [cookName, setCookName] = useState<string | null>(null)

  const addItem = (dish: Dish, cId: string, cName: string) => {
    // If adding from a different cook, clear cart first
    if (cookId && cookId !== cId) {
      if (!window.confirm(`Your cart has items from ${cookName}. Clear cart and add from ${cName}?`)) return
      setItems([])
    }
    setCookId(cId)
    setCookName(cName)
    setItems(prev => {
      const existing = prev.find(i => i.dish.id === dish.id)
      if (existing) return prev.map(i => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { dish, quantity: 1 }]
    })
  }

  const removeItem = (dishId: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.dish.id === dishId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0)
      if (updated.length === 0) { setCookId(null); setCookName(null) }
      return updated
    })
  }

  const clearCart = () => { setItems([]); setCookId(null); setCookName(null) }

  const total = items.reduce((s, i) => s + i.dish.price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, cookId, cookName, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
