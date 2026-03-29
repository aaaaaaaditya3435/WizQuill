import React, { useState, useEffect, useRef } from 'react'
import useRoomStore from '../store/roomStore'

export default function Chat({ emitChat }) {
  const [input, setInput] = useState('')
  const messages = useRoomStore((s) => s.messages)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    emitChat(input.trim())
    setInput('')
  }

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={m.system ? styles.system : styles.msg}>
            {m.system ? m.text : <><strong>{m.user}:</strong> {m.text}</>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputRow}>
        <input style={styles.input} value={input} placeholder="Type message..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()} />
        <button style={styles.btn} onClick={send}>Send</button>
      </div>
    </div>
  )
}

const styles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: 12, fontSize: 13 },
  msg: { marginBottom: 6 },
  system: { color: 'green', fontWeight: 'bold', marginBottom: 6 },
  inputRow: { display: 'flex', borderTop: '1px solid #eee' },
  input: { flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 13 },
  btn: { padding: '10px 14px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }
}
