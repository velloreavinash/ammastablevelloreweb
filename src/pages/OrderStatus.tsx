// src/pages/OrderStatus.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Order } from '../supabase'

const STATUS_STEPS = [
  { key: 'pending',          label: 'Order placed',     emoji: '📝', desc: 'Waiting for Amma to accept' },
  { key: 'accepted',         label: 'Amma accepted',    emoji: '✅', desc: 'She\'s preparing to cook' },
  { key: 'cooking',          label: 'Cooking now',      emoji: '🍳', desc: 'Fresh food being prepared' },
  { key: 'ready',            label: 'Ready for pickup', emoji: '📦', desc: 'Packed and ready' },
  { key: 'out_for_delivery', label: 'On the way',       emoji: '🛵', desc: 'Delivery partner picked up' },
  { key: 'delivered',        label: 'Delivered!',       emoji: '🎉', desc: 'Enjoy your meal' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#D4690A',
  accepted: '#2563EB',
  cooking: '#D4690A',
  ready: '#2D7A4F',
  out_for_delivery: '#2563EB',
  delivered: '#2D7A4F',
  cancelled: '#C0392B',
}

export default function OrderStatus() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = async () => {
    if (!id) return
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), cooks(display_name, location)')
      .eq('id', id)
      .single()
    if (data) setOrder(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrder()
    const sub = supabase
      .channel('web-order-status')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}`,
      }, () => fetchOrder())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!order) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>Order not found</div>
  )

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status)
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const statusColor = STATUS_COLORS[order.status] || 'var(--text2)'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 24px 80px', animation: 'fadeUp 0.4s ease forwards' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
          Order #{order.id.slice(-6).toUpperCase()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text)' }}>
            {isCancelled ? 'Order Cancelled' : isDelivered ? 'Delivered!' : 'Tracking your order'}
          </h1>
          <div style={{
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}44`,
            borderRadius: 'var(--radius-lg)',
            padding: '6px 14px',
            fontSize: 13, fontWeight: 600, color: statusColor,
          }}>
            {STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}
          </div>
        </div>
      </div>

      {/* Cook info */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>👩‍🍳</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            {(order as any).cooks?.display_name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            📍 {(order as any).cooks?.location}
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 24 }}>
            Order progress
          </h3>
          {STATUS_STEPS.map((step, index) => {
            const isDone    = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isPending = index > currentStepIndex
            return (
              <div key={step.key} style={{ display: 'flex', gap: 16, marginBottom: index < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                {/* Left column: dot + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isDone ? 'var(--success)' : isCurrent ? 'var(--saffron)' : 'var(--bg3)',
                    border: `2px solid ${isDone ? 'var(--success)' : isCurrent ? 'var(--saffron)' : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isDone ? 14 : 16,
                    flexShrink: 0,
                    transition: 'all 0.3s',
                    boxShadow: isCurrent ? '0 0 16px rgba(224,112,32,0.4)' : 'none',
                  }}>
                    {isDone ? '✓' : step.emoji}
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 32,
                      background: isDone ? 'var(--success)' : 'var(--border)',
                      margin: '4px 0',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </div>
                {/* Right column: text */}
                <div style={{ paddingBottom: index < STATUS_STEPS.length - 1 ? 24 : 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: isCurrent ? 600 : 400,
                    color: isDone ? 'var(--text2)' : isCurrent ? 'var(--text)' : 'var(--text3)',
                    marginBottom: 2,
                  }}>
                    {step.label}
                  </div>
                  {isCurrent && (
                    <div style={{ fontSize: 13, color: 'var(--saffron)' }}>{step.desc}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancelled */}
      {isCancelled && (
        <div style={{
          background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '32px',
          textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <div style={{ fontSize: 18, color: '#E57373', fontWeight: 600 }}>This order was cancelled</div>
        </div>
      )}

      {/* Delivered */}
      {isDelivered && (
        <div style={{
          background: 'var(--saffronDim)', border: '1px solid rgba(224,112,32,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '32px',
          textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
            Enjoy your meal!
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)' }}>
            Made with love by {(order as any).cooks?.display_name}
          </div>
        </div>
      )}

      {/* Order items */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Your order
        </h3>
        {order.order_items?.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--text2)', fontSize: 14 }}>{item.quantity}× {item.dish_name}</span>
            <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--saffron)' }}>₹{order.total_amount}</span>
        </div>
        {order.delivery_address && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Delivery to</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{order.delivery_address}</div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '14px',
          color: 'var(--text2)', fontWeight: 500, fontSize: 15, cursor: 'pointer',
        }}
      >
        ← Back to home
      </button>
    </div>
  )
}
