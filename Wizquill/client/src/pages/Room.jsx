import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useSocket from '../hooks/useSocket'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import Chat from '../components/Chat'
import useRoomStore from '../store/roomStore'
import useAuthStore from '../store/authStore'

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const username = useRoomStore((s) => s.username)
  const users = useRoomStore((s) => s.users)
  const { emitDraw, emitClear, emitChat } = useSocket(code, username)
  const { token } = useAuthStore()
  const canvasAreaRef = useRef(null)

  const [showPost, setShowPost] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  const handleClear = () => {
    useRoomStore.getState().clearStrokes()
    emitClear()
  }

  const saveAndPost = async () => {
    setPosting(true)
    // Merge bg + strokes + preview canvases into one image
    const canvases = canvasAreaRef.current?.querySelectorAll('canvas')
    if (!canvases?.length) return setPosting(false)

    const merged = document.createElement('canvas')
    merged.width = canvases[0].width
    merged.height = canvases[0].height
    const ctx = merged.getContext('2d')
    canvases.forEach(c => ctx.drawImage(c, 0, 0))
    const image = merged.toDataURL('image/png')

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: postTitle || 'Untitled', image })
    })
    setPosting(false)
    if (res.ok) { setPosted(true); setTimeout(() => { setShowPost(false); setPosted(false); setPostTitle('') }, 1500) }
  }

  return (
    <div style={s.layout}>
      <div style={s.board}>
        <Toolbar onClear={handleClear} />
        <div ref={canvasAreaRef} style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Canvas emitDraw={emitDraw} />
        </div>
      </div>

      <div style={s.sidebar}>
        <div style={s.sideHeader}>
          <span style={s.sectionLabel}>ROOM</span>
          <span style={s.codeBadge}>{code}</span>
        </div>

        {/* Save & Post button */}
        <div style={s.postBtnWrap}>
          <button style={s.postBtn} onClick={() => setShowPost(true)}>
            📤 Save & Post to Feed
          </button>
          <button style={s.feedBtn} onClick={() => navigate('/feed')}>← Feed</button>
        </div>

        <div style={s.usersPanel}>
          <p style={s.sectionLabel}>ONLINE — {users.length}</p>
          {users.map((u, i) => (
            <div key={i} style={s.userRow}>
              <span style={{ ...s.dot, background: avatarColor(u) }} />
              <span style={s.userName}>{u}</span>
              {u === username && <span style={s.youBadge}>you</span>}
            </div>
          ))}
        </div>

        <Chat emitChat={emitChat} />
      </div>

      {/* Post modal */}
      {showPost && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>📤 Post to Feed</h3>
            <p style={s.modalSub}>Your current canvas will be shared publicly.</p>
            <input style={s.modalInput} placeholder="Give it a title (optional)"
              value={postTitle} onChange={e => setPostTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveAndPost()} />
            {posted
              ? <div style={s.successMsg}>✅ Posted successfully!</div>
              : <div style={s.modalBtns}>
                  <button style={s.modalCancel} onClick={() => setShowPost(false)}>Cancel</button>
                  <button style={s.modalPost} onClick={saveAndPost} disabled={posting}>
                    {posting ? 'Posting...' : 'Post Now →'}
                  </button>
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

const palette = ['#7c6af7','#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa']
const avatarColor = (name) => palette[name.charCodeAt(0) % palette.length]

const s = {
  layout: { display: 'flex', height: '100vh', background: 'var(--bg)' },
  board: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  sidebar: { width: 290, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderLeft: '1px solid var(--border)' },
  sideHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' },
  codeBadge: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent2)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: 3 },
  postBtnWrap: { display: 'flex', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border)' },
  postBtn: { flex: 1, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  feedBtn: { padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' },
  usersPanel: { padding: '14px 18px', borderBottom: '1px solid var(--border)' },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.5 },
  userRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  userName: { fontSize: 13, color: 'var(--text)', flex: 1 },
  youBadge: { fontSize: 10, color: 'var(--accent)', background: 'rgba(124,106,247,0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 28px', width: 360, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 },
  modalSub: { fontSize: 13, color: 'var(--muted)', marginTop: -6 },
  modalInput: { padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, outline: 'none' },
  modalBtns: { display: 'flex', gap: 10 },
  modalCancel: { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 },
  modalPost: { flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  successMsg: { textAlign: 'center', color: 'var(--success)', fontWeight: 700, fontSize: 15, padding: '8px 0' },
}
