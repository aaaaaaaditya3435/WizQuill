import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRoomStore from '../store/roomStore'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [commentInputs, setCommentInputs] = useState({})
  const [openComments, setOpenComments] = useState({})
  const { token, username, logout } = useAuthStore()
  const { theme, toggleTheme } = useRoomStore()
  const navigate = useNavigate()
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    document.body.style.overflow = 'auto'
    fetchPosts()
    return () => { document.body.style.overflow = 'hidden' }
  }, [])

  const fetchPosts = async () => {
    const res = await fetch('/api/posts')
    setPosts(await res.json())
  }

  const like = async (id) => {
    const res = await fetch(`/api/posts/${id}/like`, { method: 'POST', headers: authHeaders })
    const { likes } = await res.json()
    setPosts(ps => ps.map(p => p._id === id ? { ...p, likes } : p))
  }

  const comment = async (id) => {
    const text = commentInputs[id]?.trim()
    if (!text) return
    const res = await fetch(`/api/posts/${id}/comment`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ text })
    })
    const comments = await res.json()
    setPosts(ps => ps.map(p => p._id === id ? { ...p, comments } : p))
    setCommentInputs(c => ({ ...c, [id]: '' }))
  }

  const download = (post) => {
    const a = document.createElement('a')
    a.href = post.image
    a.download = `${post.title || 'wizquill'}.png`
    a.click()
  }

  const deletePost = async (id) => {
    await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: authHeaders })
    setPosts(ps => ps.filter(p => p._id !== id))
  }

  return (
    <div style={s.page}>
      {/* Top nav */}
      <div style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.navLogo}>🧙 Wizquill</span>
        </div>
        <div style={s.navRight}>
          <button style={s.canvasBtn} onClick={() => navigate('/canvas')}>
            🎨 Go to Canvas
          </button>
          <button style={s.iconBtn} onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button style={s.userChip} onClick={() => navigate('/profile')}>@{username}</button>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/') }}>Sign out</button>
        </div>
      </div>

      {/* Feed */}
      <div style={s.feed}>
        {posts.length === 0 && (
          <div style={s.empty}>
            <p style={{ fontSize: 48 }}>🎨</p>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>No posts yet. Be the first to share your art!</p>
          </div>
        )}
        {posts.map(post => (
          <div key={post._id} style={s.card}>
            {/* Header */}
            <div style={s.cardHeader}>
              <span style={{ ...s.avatar, background: avatarColor(post.author) }}>
                {post.author[0].toUpperCase()}
              </span>
              <div>
                <div style={s.authorName}
                  onClick={() => navigate(`/profile/${post.author}`)}
                  title={`View ${post.author}'s profile`}>
                  {post.author}
                </div>
                <div style={s.postDate}>{new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
              {post.author === username && (
                <button style={s.deleteBtn} onClick={() => deletePost(post._id)} title="Delete">✕</button>
              )}
            </div>

            {/* Title */}
            {post.title && post.title !== 'Untitled' && (
              <p style={s.postTitle}>{post.title}</p>
            )}

            {/* Image */}
            <img src={post.image} alt={post.title} style={s.postImg} />

            {/* Actions */}
            <div style={s.actions}>
              <button style={s.actionBtn} onClick={() => like(post._id)}>
                <span style={{ color: post.likes.includes(username) ? '#f472b6' : 'var(--muted)' }}>♥</span>
                <span style={s.actionCount}>{post.likes.length}</span>
              </button>
              <button style={s.actionBtn} onClick={() => setOpenComments(o => ({ ...o, [post._id]: !o[post._id] }))}>
                <span style={{ color: 'var(--muted)' }}>💬</span>
                <span style={s.actionCount}>{post.comments.length}</span>
              </button>
              <button style={s.actionBtn} onClick={() => download(post)}>
                <span style={{ color: 'var(--muted)' }}>⬇</span>
                <span style={{ ...s.actionCount, fontSize: 11 }}>Download</span>
              </button>
            </div>

            {/* Comments */}
            {openComments[post._id] && (
              <div style={s.commentsBox}>
                <div style={s.commentsList}>
                  {post.comments.map((c, i) => (
                    <div key={i} style={s.commentRow}>
                      <span style={s.commentAuthor}>{c.author}</span>
                      <span style={s.commentText}>{c.text}</span>
                    </div>
                  ))}
                  {post.comments.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 12 }}>No comments yet</p>}
                </div>
                <div style={s.commentInput}>
                  <input style={s.cinput} placeholder="Add a comment..."
                    value={commentInputs[post._id] || ''}
                    onChange={e => setCommentInputs(c => ({ ...c, [post._id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && comment(post._id)} />
                  <button style={s.sendBtn} onClick={() => comment(post._id)}>→</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const palette = ['#7c6af7','#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa']
const avatarColor = (name) => palette[name.charCodeAt(0) % palette.length]

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' },
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogo: { fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  canvasBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  iconBtn: { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 16 },
  userChip: { fontSize: 13, color: 'var(--muted)', fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer' },
  logoutBtn: { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 },
  feed: { maxWidth: 640, margin: '32px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 },
  empty: { textAlign: 'center', padding: '80px 0' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' },
  avatar: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  authorName: { fontWeight: 600, fontSize: 14, color: 'var(--text)', cursor: 'pointer' },
  postDate: { fontSize: 11, color: 'var(--muted)', marginTop: 1 },
  deleteBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '4px 8px' },
  postTitle: { padding: '0 16px 10px', fontWeight: 600, fontSize: 15, color: 'var(--text)' },
  postImg: { width: '100%', display: 'block', maxHeight: 500, objectFit: 'contain', background: 'var(--surface2)' },
  actions: { display: 'flex', gap: 4, padding: '10px 12px', borderTop: '1px solid var(--border)' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 },
  actionCount: { fontSize: 13, color: 'var(--muted)', fontWeight: 600 },
  commentsBox: { borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' },
  commentRow: { display: 'flex', gap: 8, fontSize: 13 },
  commentAuthor: { fontWeight: 700, color: 'var(--accent2)', flexShrink: 0 },
  commentText: { color: 'var(--text)' },
  commentInput: { display: 'flex', gap: 8 },
  cinput: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' },
  sendBtn: { padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 700 },
}
