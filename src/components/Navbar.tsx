// src/components/Navbar.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../CartContext'

export default function Navbar() {
  const { count } = useCart()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,8,8,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>🍛</span>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
            Amma's Table
          </div>
          <div style={{ fontSize: 10, color: 'var(--saffron)', letterSpacing: 2 }}>అమ్మ వంట</div>
        </div>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ color: 'var(--text2)', fontSize: 14, fontWeight: 500 }}>Home</Link>

        {/* Cart button */}
        <button
          onClick={() => navigate('/cart')}
          style={{
            position: 'relative',
            background: count > 0 ? 'var(--saffron)' : 'var(--bg3)',
            border: '1px solid ' + (count > 0 ? 'var(--saffron)' : 'var(--border)'),
            color: count > 0 ? '#fff' : 'var(--text2)',
            borderRadius: 'var(--radius)',
            padding: '8px 16px',
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          🛒 Cart
          {count > 0 && (
            <span style={{
              background: '#fff', color: 'var(--saffron)',
              borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {count}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
