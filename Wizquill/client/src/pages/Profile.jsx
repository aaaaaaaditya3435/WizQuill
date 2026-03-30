import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRoomStore from '../store/roomStore'

const COLORS = ['#7c6af7','#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa','#facc15','#f87171']
const palette = ['#7c6af7','#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa']
const avatarColor = (name, custom) => custom || palette[name?.charCodeAt(0) % palette.length]

export default function Profile() {
  const { username: paramUser } = useParams()
  const { token, username: me } = useAuthStore()
  const { theme, toggleTheme } = useRoomStore()
  const navigate = useNavigate()

  const viewingUser = paramUser || me
  const isOwn = viewingUser === me

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [avatarCol, setAvatarCol] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/users/${viewingUser}`)
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setBio(data.bio || '')
        setAvatarCol(data.avatarColor || '')
        setLoading(false)
      })
  }, [viewingUser])

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bio, avatarColor: avatarCol }),
    })
    const data = await res.json()
    setProfile(p => ({ ...p, bio: data.bio, avatarColor: data.avatarColor }))
    setSaving(false)
    setEditing(false)
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</span>
    </div>
  )

  if (profile?.error) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--danger)' }}>User not found</span>
    </div>
  )

  const color = avatarColor(profile.username, profile.avatarColor)

  return (
    <div style={s.page}>
      {/* Nav */}
      <div style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate('/feed')}>← Feed</button>
        <span style={s.navLogo}>🧙 Wizquill</span>
        <button style={s.iconBtn} onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>

      <div style={s.content}>
        {/* Profile header card */}
        <div style={s.headerCard}>
          {/* Avatar */}
          <div style={{ ...s.avatar, background: color }}>
            {profile.username[0].toUpperCase()}
          </div>

          <div style={s.headerInfo}>
            <div style={s.usernameRow}>
              <h1 style={s.username}>{profile.username}</h1>
              {isOwn && !editing && (
                <button style={s.editBtn} onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              )}
            </div>

            <p style={s.joinDate}>Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            {editing ? (
              <div style={s.editBox}>
                {/* Color picker */}
                <div style={s.colorRow}>
                  <span style={s.editLabel}>Avatar color</span>
                  <div style={s.colorSwatches}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setAvatarCol(c)}
                        style={{ ...s.swatch, background: c, outline: avatarCol === c ? '2px solid var(--text)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
                <textarea style={s.bioInput} placeholder="Write a short bio..." maxLength={160}
                  value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                <div style={s.editActions}>
                  <button style={s.cancelBtn} onClick={() => { setEditing(false); setBio(profile.bio); setAvatarCol(profile.avatarColor) }}>Cancel</button>
                  <button style={s.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            ) : (
              <p style={s.bio}>{profile.bio || (isOwn ? 'Add a bio to tell people about yourself.' : 'No bio yet.')}</p>
            )}
          </div>

          {/* Stats */}
          <div style={s.stats}>
            <div style={s.stat}>
              <span style={s.statNum}>{profile.posts.length}</span>
              <span style={s.statLabel}>Posts</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={s.statNum}>{profile.totalLikes}</span>
              <span style={s.statLabel}>Likes</span>
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div style={s.sectionTitle}>
          {isOwn ? 'Your Artwork' : `${profile.username}'s Artwork`}
          <span style={s.postCount}>{profile.posts.length}</span>
        </div>

        {profile.posts.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: 40 }}>🎨</p>
            <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
              {isOwn ? "You haven't posted anything yet." : 'No posts yet.'}
            </p>
            {isOwn && (
              <button style={s.goDrawBtn} onClick={() => navigate('/canvas')}>Start Drawing →</button>
            )}
          </div>
        ) : (
          <div style={s.grid}>
            {profile.posts.map(post => (
              <div key={post._id} style={s.gridCard} className="profile-grid-card" onClick={() => setLightbox(post)}>
                <img src={post.image} alt={post.title} style={s.gridImg} />
                <div style={s.gridOverlay} className="grid-overlay">
                  <span style={s.gridTitle}>{post.title !== 'Untitled' ? post.title : ''}</span>
                  <span style={s.gridLikes}>♥ {post.likes.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={s.lightboxBg} onClick={() => setLightbox(null)}>
          <div style={s.lightboxCard} onClick={e => e.stopPropagation()}>
            <div style={s.lightboxHeader}>
              <span style={s.lightboxTitle}>{lightbox.title}</span>
              <button style={s.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
            </div>
            <img src={lightbox.image} alt={lightbox.title} style={s.lightboxImg} />
            <div style={s.lightboxFooter}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                {new Date(lightbox.createdAt).toLocaleDateString()}
              </span>
              <span style={{ color: '#f472b6', fontSize: 13 }}>♥ {lightbox.likes.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' },
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)' },
  backBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 },
  navLogo: { fontSize: 17, fontWeight: 700, color: 'var(--text)' },
  iconBtn: { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 16 },
  content: { maxWidth: 780, margin: '32px auto', padding: '0 16px 60px' },

  headerCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 32, flexShrink: 0 },
  headerInfo: { flex: 1, minWidth: 200 },
  usernameRow: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  username: { fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 },
  editBtn: { padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  joinDate: { fontSize: 12, color: 'var(--muted)', margin: '4px 0 10px' },
  bio: { fontSize: 14, color: 'var(--text)', lineHeight: 1.6, opacity: 0.85 },

  editBox: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
  editLabel: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.8 },
  colorRow: { display: 'flex', alignItems: 'center', gap: 12 },
  colorSwatches: { display: 'flex', gap: 6 },
  swatch: { width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', outlineOffset: 2, transition: 'outline 0.1s' },
  bioInput: { padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit' },
  editActions: { display: 'flex', gap: 8 },
  cancelBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 },
  saveBtn: { padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },

  stats: { display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto', flexShrink: 0 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  statLabel: { fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, background: 'var(--border)' },

  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  postCount: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: 'var(--accent2)', fontWeight: 700 },

  empty: { textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  goDrawBtn: { marginTop: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  gridCard: { position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', aspectRatio: '4/3' },
  gridImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' },
  gridOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 12px', opacity: 0, transition: 'opacity 0.2s' },
  gridTitle: { fontSize: 12, fontWeight: 600, color: '#fff' },
  gridLikes: { fontSize: 12, color: '#f472b6', fontWeight: 700 },

  lightboxBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)', padding: 16 },
  lightboxCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' },
  lightboxHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' },
  lightboxTitle: { fontWeight: 600, fontSize: 15, color: 'var(--text)' },
  lightboxClose: { background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' },
  lightboxImg: { width: '100%', maxHeight: '65vh', objectFit: 'contain', display: 'block', background: 'var(--surface2)' },
  lightboxFooter: { display: 'flex', justifyContent: 'space-between', padding: '12px 18px' },
}
