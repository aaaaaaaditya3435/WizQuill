import React, { useState, useEffect, useRef } from 'react'
import useRoomStore from '../store/roomStore'

const BRUSHES = [
  { brush: 'round',       icon: '●', label: 'Round' },
  { brush: 'square',      icon: '■', label: 'Square' },
  { brush: 'calligraphy', icon: '✒', label: 'Calligraphy' },
  { brush: 'spray',       icon: '💨', label: 'Spray' },
  { brush: 'dashed',      icon: '╌', label: 'Dashed' },
]

const SHAPES = [
  { mode: 'pen',    icon: '✏️', label: 'Freehand' },
  { mode: 'eraser', icon: '◻',  label: 'Eraser' },
  { mode: 'line',   icon: '╱',  label: 'Line' },
  { mode: 'arrow',  icon: '→',  label: 'Arrow' },
  { mode: 'rect',   icon: '▭',  label: 'Rectangle' },
  { mode: 'circle', icon: '◯',  label: 'Ellipse' },
  { mode: 'triangle', icon: '△', label: 'Triangle' },
  { mode: 'star',   icon: '★',  label: 'Star' },
  { mode: 'fill',   icon: '🪣', label: 'Fill Bucket' },
]

const PALETTES = {
  Vibrant:  ['#f87171','#fb923c','#facc15','#34d399','#60a5fa','#a78bfa','#f472b6','#ffffff'],
  Pastel:   ['#fca5a5','#fdba74','#fde68a','#6ee7b7','#93c5fd','#c4b5fd','#f9a8d4','#e2e8f0'],
  Dark:     ['#7f1d1d','#78350f','#713f12','#14532d','#1e3a5f','#3b0764','#831843','#0f172a'],
  Mono:     ['#ffffff','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#111827'],
}

function Dropdown({ label, icon, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`wq-dropdown${open ? ' open' : ''}`}>
      <button style={s.dropTrigger} onClick={() => setOpen(o => !o)}>
        <span>{icon}</span>
        <span style={{ fontSize: 12 }}>{label}</span>
        <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }}>▾</span>
      </button>
      <div className="wq-dropdown-menu">{children}</div>
    </div>
  )
}

export default function Toolbar({ onClear }) {
  const { tool, setTool, theme, toggleTheme } = useRoomStore()
  const [paletteTab, setPaletteTab] = useState('Vibrant')

  const currentShape = SHAPES.find(s => s.mode === tool.mode) || SHAPES[0]
  const currentBrush = BRUSHES.find(b => b.brush === tool.brush) || BRUSHES[0]

  return (
    <div style={s.bar}>

      {/* Brush dropdown */}
      <Dropdown label={currentBrush.label} icon={currentBrush.icon}>
        <div className="wq-dropdown-label">BRUSH TYPE</div>
        {BRUSHES.map(b => (
          <button key={b.brush}
            className={`wq-dropdown-item${tool.brush === b.brush ? ' active' : ''}`}
            onClick={() => setTool({ brush: b.brush, mode: tool.mode === 'eraser' ? 'pen' : tool.mode })}>
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{b.icon}</span>
            {b.label}
          </button>
        ))}
      </Dropdown>

      <div style={s.sep} />

      {/* Shapes dropdown */}
      <Dropdown label={currentShape.label} icon={currentShape.icon}>
        <div className="wq-dropdown-label">DRAW MODE</div>
        {SHAPES.map(sh => (
          <button key={sh.mode}
            className={`wq-dropdown-item${tool.mode === sh.mode ? ' active' : ''}`}
            onClick={() => setTool({ mode: sh.mode })}>
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{sh.icon}</span>
            {sh.label}
          </button>
        ))}
        {['rect','circle','triangle','star'].includes(tool.mode) && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <button
              className={`wq-dropdown-item${tool.fill ? ' active' : ''}`}
              onClick={() => setTool({ fill: !tool.fill })}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>⬛</span>
              {tool.fill ? 'Filled' : 'Outline only'}
            </button>
          </>
        )}
      </Dropdown>

      <div style={s.sep} />

      {/* Colors dropdown */}
      <Dropdown
        label="Color"
        icon={<span style={{ width: 14, height: 14, borderRadius: '50%', background: tool.color, display: 'inline-block', border: '2px solid var(--border)' }} />}
      >
        {/* Palette tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 4px 6px', flexWrap: 'wrap' }}>
          {Object.keys(PALETTES).map(p => (
            <button key={p}
              style={{ ...s.tabBtn, ...(paletteTab === p ? s.tabActive : {}) }}
              onClick={() => setPaletteTab(p)}>{p}</button>
          ))}
        </div>
        {/* Swatches grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, padding: '0 6px 6px' }}>
          {PALETTES[paletteTab].map(c => (
            <button key={c} title={c}
              style={{
                width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                outline: tool.color === c ? `2px solid var(--accent)` : '2px solid transparent',
                outlineOffset: 2, transition: 'outline 0.1s'
              }}
              onClick={() => setTool({ color: c, mode: tool.mode === 'eraser' ? 'pen' : tool.mode })}
            />
          ))}
        </div>
        {/* Custom picker */}
        <div style={{ padding: '4px 6px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--muted)' }}>
            <input type="color" value={tool.color}
              onChange={e => setTool({ color: e.target.value, mode: tool.mode === 'eraser' ? 'pen' : tool.mode })}
              style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
            Custom
          </label>
        </div>
      </Dropdown>

      <div style={s.sep} />

      {/* Size */}
      <div style={s.group}>
        <span style={s.label}>Size</span>
        <input type="range" min="1" max="60" value={tool.size}
          onChange={e => setTool({ size: +e.target.value })}
          style={s.slider} />
        <span style={s.val}>{tool.size}px</span>
      </div>

      <div style={s.sep} />

      {/* Opacity */}
      <div style={s.group}>
        <span style={s.label}>Opacity</span>
        <input type="range" min="0.05" max="1" step="0.05" value={tool.opacity}
          onChange={e => setTool({ opacity: +e.target.value })}
          style={s.slider} />
        <span style={s.val}>{Math.round(tool.opacity * 100)}%</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button style={s.iconBtn} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={s.sep} />

      {/* Clear */}
      <button style={s.clearBtn} onClick={onClear}>✕ Clear</button>
    </div>
  )
}

const s = {
  bar: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    padding: '7px 12px', background: 'var(--surface)',
    borderBottom: '1px solid var(--border)', userSelect: 'none', zIndex: 10,
  },
  group: { display: 'flex', alignItems: 'center', gap: 6 },
  sep: { width: 1, height: 26, background: 'var(--border)', margin: '0 2px', flexShrink: 0 },
  dropTrigger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
    transition: 'border-color 0.15s',
  },
  label: { fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.4, whiteSpace: 'nowrap' },
  slider: { width: 88, accentColor: 'var(--accent)', cursor: 'pointer' },
  val: { fontSize: 11, color: 'var(--muted)', minWidth: 34, textAlign: 'right' },
  iconBtn: {
    width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 8,
    background: 'var(--surface2)', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  clearBtn: {
    padding: '6px 12px', border: '1px solid rgba(248,113,113,0.4)',
    borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: 'var(--danger)',
    cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  tabBtn: {
    padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 11,
  },
  tabActive: { background: 'var(--surface2)', color: 'var(--text)', borderColor: 'var(--accent)' },
}
