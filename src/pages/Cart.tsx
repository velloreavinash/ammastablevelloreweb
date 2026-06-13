// src/pages/Cart.tsx
// Updated with Razorpay payment integration

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useCart } from '../CartContext'

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Cart() {
  const { items, cookId, cookName, removeItem, addItem, clearCart, total, count } = useCart()
  const navigate = useNavigate()
  const [address, setAddress]   = useState('')
  const [notes, setNotes]       = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [placing, setPlacing]   = useState(false)
  const [error, setError]       = useState('')

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handlePayment = async () => {
    if (!cookId) return
    if (!name.trim())    { setError('Please enter your name'); return }
    if (!phone.trim())   { setError('Please enter your phone number'); return }
    if (!email.trim())   { setError('Please enter your email'); return }
    if (!address.trim()) { setError('Please enter your delivery address'); return }

    setPlacing(true)
    setError('')

    // Create order in Supabase first (status: pending payment)
    const cookEarnings = +(total * 0.68).toFixed(2)
    const platformFee  = +(total * 0.12).toFixed(2)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        cook_id: cookId,
        customer_id: email, // using email as customer ID for web orders
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
      setError('Failed to create order. Please try again.')
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

    // Open Razorpay payment popup
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: total * 100, // Razorpay takes amount in paise (1 rupee = 100 paise)
      currency: 'INR',
      name: "Amma's Table",
      description: `Order from ${cookName}`,
      order_id: undefined, // We're using client-side integration (no backend needed)
      prefill: {
        name: name,
        email: email,
        contact: phone,
      },
      notes: {
        order_id: order.id,
        delivery_address: address,
      },
      theme: {
        color: '#E07020',
      },
      handler: async function (response: any) {
        // Payment successful — update order status
        await supabase
          .from('orders')
          .update({
            status: 'accepted',
            notes: `Payment ID: ${response.razorpay_payment_id}. ${notes || ''}`,
          })
          .eq('id', order.id)

        clearCart()
        navigate(`/order/${order.id}`)
      },
      modal: {
        ondismiss: async function () {
          // Customer closed the payment popup — cancel the order
          await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', order.id)
          setPlacing(false)
          setError('Payment was cancelled. Your order has not been placed.')
        }
      }
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      setError('Could not open payment window. Please refresh and try again.')
      setPlacing(false)
    }
  }

  if (count === 0) return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>
        Your cart is empty
      </h2>
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

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>
        Your Order
      </h1>
      <p style={{ color: 'var(--text3)', marginBottom: 32, fontSize: 14 }}>from {cookName}</p>

      {/* Items */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Items
        </h3>
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

      {/* Customer details */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Your details
        </h3>

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Full name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Phone number *</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="10-digit mobile number"
          type="tel"
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Email *</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="for order confirmation"
          type="email"
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Delivery address *</label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="House no, street, area, Hyderabad"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Special notes (optional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Less spicy, no onion, ring the bell etc."
          style={inputStyle}
        />
      </div>

      {/* Price breakdown */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Price breakdown
        </h3>
        {[
          { label: 'Subtotal',           value: `₹${total}` },
          { label: 'Cook earnings (68%)', value: `₹${(total * 0.68).toFixed(0)}` },
          { label: 'Platform fee (12%)',  value: `₹${(total * 0.12).toFixed(0)}` },
          { label: 'Delivery',            value: 'Charged separately' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
            <span style={{ color: 'var(--text3)' }}>{row.label}</span>
            <span style={{ color: 'var(--text2)' }}>{row.value}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>Amount to pay</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--saffron)' }}>₹{total}</span>
        </div>
      </div>

      {/* Payment note */}
      <div style={{
        background: 'var(--saffronDim)', border: '1px solid rgba(224,112,32,0.2)',
        borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24,
        fontSize: 13, color: 'var(--text2)',
      }}>
        🔒 Payments are secured by Razorpay. You can pay via UPI, card, netbanking, or wallet.
      </div>

      {error && (
        <div style={{
          background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
          color: '#E57373', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={placing}
        style={{
          width: '100%',
          background: placing ? 'var(--bg3)' : 'var(--saffron)',
          border: 'none', borderRadius: 'var(--radius-lg)',
          padding: '18px', color: '#fff', fontWeight: 700, fontSize: 17,
          cursor: placing ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {placing ? (
          <>
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Opening payment…
          </>
        ) : (
          `Pay ₹${total} securely →`
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
        Powered by Razorpay · UPI · Cards · Netbanking · Wallets
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)',
  padding: '12px 14px',
  fontSize: 15,
  color: 'var(--text)',
  outline: 'none',
  marginBottom: 0,
}
