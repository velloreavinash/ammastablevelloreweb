// src/pages/Home.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Cook } from '../supabase'

const CATEGORIES = [
  { emoji: '🍚', label: 'Rice' },
  { emoji: '🫓', label: 'Breakfast' },
  { emoji: '🍛', label: 'Curry' },
  { emoji: '🍬', label: 'Sweets' },
  { emoji: '☕', label: 'Tiffin' },
  { emoji: '🥗', label: 'Salads' },
  { emoji: '🫕', label: 'Stews' },
  { emoji: '🥘', label: 'Lunch' },
]

export default function Home() {
  const [cooks, setCooks] = useState<Cook[]>([])
  const [filtered, setFiltered] = useState<Cook[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('cooks')
      .select('*, dishes(*)')
      .eq('is_approved', true)
      .order('rating', { ascending: false })
      .then(({ data }) => {
        setCooks(data || [])
        setFiltered(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(cooks); return }
    const q = search.toLowerCase()
    setFiltered(cooks.filter(c =>
      c.display_name.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.dishes?.some(d => d.name.toLowerCase().includes(q))
    ))
  }, [search, cooks])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Hero */}
      <div style={{
        padding: '60px 24px 48px',
        maxWidth: 900, margin: '0 auto',
        textAlign: 'center',
        animation: 'fadeUp 0.6s ease forwards',
      }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: 'var(--saffron)', textTransform: 'uppercase', marginBottom: 16 }}>
          Hyderabad · Home Kitchens
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.15,
          marginBottom: 20,
        }}>
          Real food.<br />
          <span style={{ color: 'var(--saffron)' }}>Real mothers.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Recipes that restaurants will never have — made fresh in home kitchens by women who've spent decades perfecting them.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by dish, Amma, or area…"
            style={{
              width: '100%',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px 14px 48px',
              fontSize: 15,
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '0 24px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 13, letterSpacing: 2, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 20 }}>
          What are you craving?
        </h2>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setSearch(cat.label)}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                minWidth: 80,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--saffron)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--saffronDim)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
              }}
            >
              <span style={{ fontSize: 28 }}>{cat.emoji}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cook listing */}
      <div style={{ padding: '0 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text)' }}>
            {filtered.filter(c => c.is_live).length} Ammas cooking now
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} total</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontSize: 18 }}>No Ammas found for "{search}"</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
            {filtered.map((cook, i) => (
              <CookCard key={cook.id} cook={cook} index={i} onClick={() => navigate(`/amma/${cook.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CookCard({ cook, index, onClick }: { cook: Cook; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hovered ? 'var(--saffron)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        animation: `fadeUp 0.5s ease ${index * 0.08}s both`,
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: 180, background: 'var(--bg3)' }}>
        {cook.photo_url ? (
          <img src={cook.photo_url} alt={cook.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            👩‍🍳
          </div>
        )}
        {/* Live badge */}
        {cook.is_live && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid #22c55e',
            borderRadius: 'var(--radius-lg)',
            padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#22c55e',
          }}>
            <span className="live-dot" /> Live
          </div>
        )}
        {/* Rating */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)',
          padding: '4px 10px',
          fontSize: 13, fontWeight: 600, color: 'var(--saffron2)',
        }}>
          ⭐ {cook.rating?.toFixed(1)}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
            {cook.display_name}
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {cook.total_orders} orders
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
          📍 {cook.location || 'Hyderabad'}
        </div>

        {/* Dishes preview */}
        {cook.dishes && cook.dishes.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {cook.dishes.slice(0, 3).map(d => (
              <span key={d.id} style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '3px 10px',
                fontSize: 12, color: 'var(--text2)',
              }}>
                {d.name}
              </span>
            ))}
            {cook.dishes.length > 3 && (
              <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>
                +{cook.dishes.length - 3} more
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>
            From ₹{Math.min(...(cook.dishes?.map(d => d.price) || [0]))}
          </span>
          <span style={{ fontSize: 13, color: 'var(--saffron)', fontWeight: 600 }}>
            View menu →
          </span>
        </div>
      </div>
    </div>
  )
}
