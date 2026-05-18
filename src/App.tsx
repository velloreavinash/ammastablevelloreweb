// src/App.tsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './CartContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AmmaProfile from './pages/AmmaProfile'
import Cart from './pages/Cart'
import OrderStatus from './pages/OrderStatus'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/amma/:id"   element={<AmmaProfile />} />
          <Route path="/cart"       element={<Cart />} />
          <Route path="/order/:id"  element={<OrderStatus />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
