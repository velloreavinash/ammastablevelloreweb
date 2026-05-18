// src/pages/Cart.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useCart } from '../CartContext'

export default function Cart() {
  const { items, cookId, cookName, removeItem, addItem, clearCart, total, count } = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const placeOrder = async () => {
    if (!cookId) return
    if (!address.trim()) { setError('Please enter your delivery address'); return }
    if (!email.trim()) { setError('Please enter your email to receive order updates'); return }

    setPlacing(true)
    setError('')

    try {
      // Get or create customer profile
      const { data: { user } } = await supabase.auth.getUser()

      let customerId = user?.id

      if (!customerId) {
        // Guest checkout — sign in anonymously or use email
        const { data, error: authError } = await supabase.auth.signInWithOtp({ email })
        if (authError) { setError('Failed to verify email: ' + authError.message); setPlacing(false); return }
        // For demo, create order with a placeholder
        customerId = email
      }

      const cookEarnings  = +(total * 0.68).toFixed(2)
      const platformFee   = +(total * 0.12).toFixed(2)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          cook_id: cookId,
          total_amount: total,
          cook_earnings: cookEarnings,
          platform_fee: platformFee,
          status: 'pending',
          delivery_address: address,
          notes: notes || null,
        })
        .select()
        .single()

      if (orderError || !order) {
        setError('Failed to place order. Please try again.')
        setPlacing(false)
        return
      }

      // Insert order items
      await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id,
          dish_id: i.dish.id,
          dish_name: i.dish.name,
          quantity: i.quantity,
          price: i.dish.price,
        }))
      )

      clearCart()
      navigate(`/order/${order.id}`)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setPlacing(false)
    }
  }

  if (count === 0) return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>Your cart is empty</h2>
      <p style={{ color: 'var(--text3)', marginBottom: 32 }}>Browse Ammas and add some dishes</p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'var(--saffron)', border: 'none', borderRadius: 'var(--radius)',
          padding: '14px 32px', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
        }}
      >
        Browse Ammas
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px 80px', animation: 'fadeUp 0.4s ease forwards' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, padding: '4px 0 20px', cursor: 'pointer' }}
      >
        ← Back
      </button>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>Your Order</h1>
      <p style={{ color: 'var(--text3)', marginBottom: 32, fontSize: 14 }}>from {cookName}</p>

      {/* Items */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>Items</h3>
        {items.map(item => (
          <div key={item.dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{item.dish.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>₹{item.dish.price} × {item.quantity}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>₹{item.dish.price * item.quantity}</span>
              <button
                onClick={() => removeItem(item.dish.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}
              >×</button>
            </div>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--saffron)' }}>₹{total}</span>
        </div>
      </div>

      {/* Delivery details */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>Delivery details</h3>

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Your email *</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="for order updates"
          type="email"
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 15,
            color: 'var(--text)', outline: 'none', marginBottom: 16,
          }}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Delivery address *</label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="House no, street, area, Hyderabad"
          rows={3}
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 15,
            color: 'var(--text)', outline: 'none', resize: 'vertical', marginBottom: 16,
          }}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Special notes (optional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Less spicy, no onion, etc."
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 15,
            color: 'var(--text)', outline: 'none',
          }}
        />
      </div>

      {/* Price breakdown */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>Price breakdown</h3>
        {[
          { label: 'Subtotal', value: `₹${total}` },
          { label: 'Cook earnings (68%)', value: `₹${(total * 0.68).toFixed(0)}` },
          { label: 'Platform fee (12%)', value: `₹${(total * 0.12).toFixed(0)}` },
          { label: 'Delivery', value: 'TBD' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
            <span style={{ color: 'var(--text3)' }}>{row.label}</span>
            <span style={{ color: 'var(--text2)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, color: '#E57373', fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={placeOrder}
        disabled={placing}
        style={{
          width: '100%', background: placing ? 'var(--bg3)' : 'var(--saffron)',
          border: 'none', borderRadius: 'var(--radius-lg)',
          padding: '16px', color: '#fff', fontWeight: 700, fontSize: 17,
          cursor: placing ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {placing ? 'Placing order…' : `Place Order · ₹${total}`}
      </button>
    </div>
  )
}
