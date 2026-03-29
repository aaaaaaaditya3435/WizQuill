import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useRoomStore from '../store/roomStore'

export default function Home() {
  const [joinCode, setJoinCode] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const { setRoom, setUsername } = useRoomStore()

  const createRoom = async () => {
    if (!name.trim()) return alert('Enter your name')
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
    })
    const data = await res.json()
    setUsername(name)
    setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  const joinRoom = async () => {
    if (!name.trim() || !joinCode.trim()) return alert('Enter name and room code')
    const res = await fetch(`/api/rooms/${joinCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
    })
    if (!res.ok) return alert('Room not found')
    const data = await res.json()
    setUsername(name)
    setRoom(data.code)
    navigate(`/room/${data.code}`)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>MakeIT.io</h1>
        <input style={styles.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <button style={styles.btn} onClick={createRoom}>Create Room</button>
        <hr style={{ width: '100%', margin: '16px 0' }} />
        <input style={styles.input} placeholder="Room code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
        <button style={{ ...styles.btn, background: '#444' }} onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f0f0' },
  card: { background: '#fff', padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { margin: 0, textAlign: 'center' },
  input: { padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { padding: '10px 12px', background: '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }
}
