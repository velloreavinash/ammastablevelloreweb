// src/pages/AmmaProfile.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Cook, Dish } from '../supabase'
import { useCart } from '../CartContext'

export default function AmmaProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cook, setCook] = useState<Cook | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, addItem, removeItem, total, count, cookId } = useCart()

  useEffect(() => {
    if (!id) return
    supabase
      .from('cooks')
      .select('*, dishes(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setCook(data); setLoading(false) })
  }, [id])

  const getQty = (dishId: string) => items.find(i => i.dish.id === dishId)?.quantity || 0

  const dishesByCategory = (cook?.dishes || []).reduce<Record<string, Dish[]>>((acc, d) => {
    if (!d.is_available) return acc
    const cat = d.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(d)
    return acc
  }, {})

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!cook) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>Cook not found</div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 120px', animation: 'fadeUp 0.5s ease forwards' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, padding: '20px 0', cursor: 'pointer' }}
      >
        ← Back
      </button>

      {/* Hero */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Photo */}
        <div style={{ position: 'relative', height: 240, background: 'var(--bg3)' }}>
          {cook.photo_url ? (
            <img src={cook.photo_url} alt={cook.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
              👩‍🍳
            </div>
          )}
          {cook.is_live && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
              border: '1px solid #22c55e',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: '#22c55e',
            }}>
              <span className="live-dot" /> Taking orders now
            </div>
          )}
          {!cook.is_live && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 14px',
              fontSize: 13, color: 'var(--text3)',
            }}>
              Not available today
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
              {cook.display_name}
            </h1>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--saffron2)' }}>⭐ {cook.rating?.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{cook.total_orders} orders</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 16 }}>📍 {cook.location || 'Hyderabad'}</div>

          {cook.bio && (
            <div style={{
              background: 'var(--saffronDim)',
              border: '1px solid rgba(224,112,32,0.2)',
              borderLeft: '3px solid var(--saffron)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 6, fontWeight: 600 }}>Her story</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{cook.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>Menu</h2>

      {Object.entries(dishesByCategory).map(([category, dishes]) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            color: 'var(--text3)', fontWeight: 600, marginBottom: 12,
          }}>
            {category}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dishes.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                qty={getQty(dish.id)}
                onAdd={() => addItem(dish, cook.id, cook.display_name)}
                onRemove={() => removeItem(dish.id)}
                disabled={!cook.is_live}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Sticky cart bar */}
      {count > 0 && cookId === cook.id && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)', maxWidth: 720,
          background: 'var(--bg3)',
          border: '1px solid var(--saffron)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          animation: 'fadeUp 0.3s ease forwards',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{count} {count === 1 ? 'item' : 'items'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>₹{total}</div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            style={{
              background: 'var(--saffron)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '12px 28px',
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Place Order →
          </button>
        </div>
      )}
    </div>
  )
}

function DishCard({ dish, qty, onAdd, onRemove, disabled }: {
  dish: Dish; qty: number; onAdd: () => void; onRemove: () => void; disabled: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{dish.name}</div>
        {dish.name_telugu && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{dish.name_telugu}</div>}
        {dish.description && (
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 8, maxWidth: 400 }}>
            {dish.description}
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--saffron)' }}>₹{dish.price}</div>
      </div>

      {/* Photo */}
      {dish.photo_url && (
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, marginRight: 16, background: 'var(--bg3)' }}>
          <img src={dish.photo_url} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Cart controls */}
      {disabled ? (
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Unavailable</span>
      ) : qty === 0 ? (
        <button
          onClick={onAdd}
          style={{
            background: 'none',
            border: '1.5px solid var(--saffron)',
            borderRadius: 'var(--radius)',
            color: 'var(--saffron)',
            padding: '8px 18px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--saffron)'
            ;(e.currentTarget as HTMLElement).style.color = '#fff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'none'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--saffron)'
          }}
        >
          Add
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onRemove}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              color: 'var(--text)', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{qty}</span>
          <button
            onClick={onAdd}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--saffron)', border: 'none',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>
      )}
    </div>
  )
}
