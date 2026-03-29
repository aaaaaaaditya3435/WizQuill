import React from 'react'
import useRoomStore from '../store/roomStore'

export default function Toolbar({ onClear }) {
  const { tool, setTool } = useRoomStore()

  return (
    <div style={styles.bar}>
      <label>🎨
        <input type="color" value={tool.color}
          onChange={e => setTool({ color: e.target.value, eraser: false })}
          style={{ marginLeft: 4 }} />
      </label>
      <label>🖌️
        <input type="range" min="1" max="20" value={tool.size}
          onChange={e => setTool({ size: +e.target.value })}
          style={{ marginLeft: 4 }} />
      </label>
      <button style={styles.btn} onClick={() => setTool({ eraser: true })}>Eraser</button>
      <button style={styles.btn} onClick={() => setTool({ eraser: false })}>Pen</button>
      <button style={{ ...styles.btn, background: '#c0392b' }} onClick={onClear}>Clear</button>
    </div>
  )
}

const styles = {
  bar: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' },
  btn: { padding: '6px 12px', border: 'none', borderRadius: 4, background: '#333', color: '#fff', cursor: 'pointer', fontSize: 13 }
}
