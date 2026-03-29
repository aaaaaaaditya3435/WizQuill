import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRoomStore from '../store/roomStore'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { theme, toggleTheme } = useRoomStore()
  const navigate = useNavigate()

  const submit = async () => {
    if (!username.trim() || !password.trim()) return setError('Fill in all fields')
    setLoading(true); setError('')
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    login(data.token, data.username)
    navigate('/feed')
  }

  return (
    <div style={s.page}>
      <button style={s.themeBtn} onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      <div style={s.blob1} /><div style={s.blob2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logoIcon}>🧙</span>
          <span style={s.logoText}>Wizquill</span>
        </div>
        <p style={s.tagline}>Draw. Share. Inspire.</p>

        {/* Tab switcher */}
        <div style={s.tabs}>
          {['login','register'].map(m => (
            <button key={m} style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}
              onClick={() => { setMode(m); setError('') }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <input style={s.input} placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <input style={s.input} placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />

        {error && <p style={s.error}>{error}</p>}

        <button style={s.btn} onClick={submit} disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', overflow: 'hidden' },
  themeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 18 },
  blob1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.18) 0%, transparent 70%)', top: -120, left: -120, pointerEvents: 'none' },
  blob2: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)', bottom: -80, right: -80, pointerEvents: 'none' },
  card: { position: 'relative', zIndex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 14, width: 360, boxShadow: '0 24px 80px rgba(0,0,0,0.45)' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 },
  tagline: { textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 4 },
  tabs: { display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, gap: 3 },
  tab: { flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' },
  tabActive: { background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, outline: 'none' },
  error: { color: 'var(--danger)', fontSize: 12, textAlign: 'center' },
  btn: { padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,106,247,0.4)' },
}
