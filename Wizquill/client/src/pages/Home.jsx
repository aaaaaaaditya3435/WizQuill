import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useRoomStore from '../store/roomStore'

export default function Home() {
  const [joinCode, setJoinCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(null)
  const navigate = useNavigate()
  const { setRoom, setUsername, theme, toggleTheme } = useRoomStore()

  const createRoom = async () => {
    if (!name.trim()) return
    setLoading('create')
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
    })
    const data = await res.json()
    setUsername(name); setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  const joinRoom = async () => {
    if (!name.trim() || !joinCode.trim()) return
    setLoading('join')
    const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
    })
    if (!res.ok) { setLoading(null); return alert('Room not found') }
    const data = await res.json()
    setUsername(name); setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  return (
    <div style={s.page}>
      <button style={s.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoIcon}>✦</span>
          <span style={s.logoText}>Wizquill</span>
        </div>
        <p style={s.tagline}>Draw. Collaborate. Create.</p>

        <input
          style={s.input}
          placeholder="Your display name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createRoom()}
        />

        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={createRoom} disabled={loading === 'create'}>
          {loading === 'create' ? '...' : '✦ Create Room'}
        </button>

        <div style={s.divider}><span style={s.dividerText}>or join existing</span></div>

        <input
          style={{ ...s.input, letterSpacing: 3, textTransform: 'uppercase' }}
          placeholder="Room code"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          maxLength={6}
        />
        <button style={{ ...s.btn, ...s.btnSecondary }} onClick={joinRoom} disabled={loading === 'join'}>
          {loading === 'join' ? '...' : '→ Join Room'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: {
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg)', overflow: 'hidden'
  },
  blob1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,106,247,0.18) 0%, transparent 70%)',
    top: -100, left: -100, pointerEvents: 'none'
  },
  blob2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
    bottom: -80, right: -80, pointerEvents: 'none'
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '40px 36px', display: 'flex',
    flexDirection: 'column', gap: 14, width: 360,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
  },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 2 },
  logoIcon: { fontSize: 22, color: 'var(--accent)' },
  logoText: { fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 },
  tagline: { textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 6 },
  input: {
    padding: '12px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    padding: '12px', borderRadius: 'var(--radius)', border: 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'opacity 0.2s, transform 0.1s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
    color: '#fff', boxShadow: '0 4px 20px rgba(124,106,247,0.4)'
  },
  btnSecondary: {
    background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)'
  },
  divider: { display: 'flex', alignItems: 'center', gap: 10 },
  dividerText: {
    color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap',
    flex: 1, textAlign: 'center',
    borderTop: '1px solid var(--border)', paddingTop: 0,
    background: 'linear-gradient(var(--surface), var(--surface)) padding-box'
  },
  themeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
