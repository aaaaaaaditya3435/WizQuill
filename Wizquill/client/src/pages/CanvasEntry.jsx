import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useRoomStore from '../store/roomStore'
import useAuthStore from '../store/authStore'

export default function CanvasEntry() {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(null)
  const navigate = useNavigate()
  const { setRoom, setUsername, theme, toggleTheme } = useRoomStore()
  const { username, token } = useAuthStore()

  // username comes from auth — pre-filled
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const createRoom = async () => {
    setLoading('create')
    const res = await fetch('/api/rooms', {
      method: 'POST', headers,
      body: JSON.stringify({ username })
    })
    const data = await res.json()
    setUsername(username)
    setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) return
    setLoading('join')
    const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}/join`, {
      method: 'POST', headers,
      body: JSON.stringify({ username })
    })
    if (!res.ok) { setLoading(null); return alert('Room not found') }
    const data = await res.json()
    setUsername(username)
    setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  return (
    <div style={s.page}>
      <button style={s.themeBtn} onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      <button style={s.backBtn} onClick={() => navigate('/feed')}>← Back to Feed</button>
      <div style={s.blob1} /><div style={s.blob2} />

      <div style={s.card}>
        <div style={s.iconRow}><span style={{ fontSize: 40 }}>🎨</span></div>
        <h2 style={s.title}>Enter Canvas</h2>
        <p style={s.sub}>Drawing as <strong style={{ color: 'var(--accent2)' }}>@{username}</strong></p>

        <button style={s.btnPrimary} onClick={createRoom} disabled={loading === 'create'}>
          {loading === 'create' ? '...' : '✦ Create New Room'}
        </button>

        <div style={s.divider}><span style={s.dividerLine} /><span style={s.dividerText}>or join existing</span><span style={s.dividerLine} /></div>

        <input
          style={{ ...s.input, letterSpacing: 4, textTransform: 'uppercase' }}
          placeholder="Enter room code"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          maxLength={6}
        />
        <button style={s.btnSecondary} onClick={joinRoom} disabled={loading === 'join'}>
          {loading === 'join' ? '...' : '→ Join Room'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', overflow: 'hidden' },
  themeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 18 },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 },
  blob1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)', top: -120, right: -120, pointerEvents: 'none' },
  blob2: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', bottom: -80, left: -80, pointerEvents: 'none' },
  card: { position: 'relative', zIndex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 14, width: 360, boxShadow: '0 24px 80px rgba(0,0,0,0.45)' },
  iconRow: { textAlign: 'center' },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  sub: { textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: -4 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, outline: 'none', textAlign: 'center' },
  btnPrimary: { padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,106,247,0.35)' },
  btnSecondary: { padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  divider: { display: 'flex', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' },
}
