import React from 'react'
import { useParams } from 'react-router-dom'
import useSocket from '../hooks/useSocket'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import Chat from '../components/Chat'
import useRoomStore from '../store/roomStore'

export default function Room() {
  const { code } = useParams()
  const username = useRoomStore((s) => s.username)
  const users = useRoomStore((s) => s.users)
  const { emitDraw, emitClear, emitChat } = useSocket(code, username)

  const handleClear = () => {
    useRoomStore.getState().clearStrokes()
    emitClear()
  }

  return (
    <div style={styles.layout}>
      <div style={styles.board}>
        <Toolbar onClear={handleClear} />
        <Canvas emitDraw={emitDraw} />
      </div>
      <div style={styles.sidebar}>
        <div style={styles.users}>
          <strong>Online ({users.length})</strong>
          {users.map((u, i) => <div key={i} style={styles.user}>● {u}</div>)}
        </div>
        <Chat emitChat={emitChat} />
      </div>
    </div>
  )
}

const styles = {
  layout: { display: 'flex', height: '100vh', background: '#eaeaea' },
  board: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  sidebar: { width: 280, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #ddd' },
  users: { padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13 },
  user: { color: '#555', marginTop: 4 }
}
