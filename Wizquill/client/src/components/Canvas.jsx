import React, { useEffect, useRef } from 'react'
import useCanvas from '../hooks/useCanvas'
import useRoomStore from '../store/roomStore'

export default function Canvas({ emitDraw }) {
  const { canvasRef, previewRef, onStart, onMove, onEnd } = useCanvas(emitDraw)
  const bgRef = useRef(null)
  const theme = useRoomStore((s) => s.theme)

  const syncSize = (currentTheme) => {
    const wrapper = canvasRef.current?.parentElement
    if (!wrapper) return
    const { width, height } = wrapper.getBoundingClientRect()
    ;[canvasRef.current, previewRef.current, bgRef.current].forEach(c => {
      if (c) { c.width = width; c.height = height }
    })
    drawBackground(bgRef.current, width, height, currentTheme)
  }

  useEffect(() => {
    syncSize(theme)
    const handler = () => syncSize(useRoomStore.getState().theme)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Redraw background when theme changes
  useEffect(() => {
    const canvas = bgRef.current
    if (!canvas) return
    drawBackground(canvas, canvas.width, canvas.height, theme)
  }, [theme])

  return (
    <div style={s.wrapper}>
      <canvas ref={bgRef} style={s.layer} />
      <canvas ref={canvasRef} style={s.layer}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      />
      <canvas ref={previewRef} style={{ ...s.layer, pointerEvents: 'none' }} />
    </div>
  )
}

function drawBackground(canvas, w, h, theme) {
  if (!canvas || !w || !h) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  const isDark = theme === 'dark'
  const bgColor   = isDark ? '#13151f' : '#f9f9ff'
  const dotColor  = isDark ? 'rgba(124,106,247,0.13)' : 'rgba(108,92,231,0.1)'
  const glowColor = isDark ? 'rgba(124,106,247,0.07)' : 'rgba(108,92,231,0.05)'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  // Dot grid
  ctx.fillStyle = dotColor
  const gap = 28
  for (let x = gap; x < w; x += gap)
    for (let y = gap; y < h; y += gap) {
      ctx.beginPath()
      ctx.arc(x, y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }

  // Radial glow
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.55)
  grad.addColorStop(0, glowColor)
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)


}

const s = {
  wrapper: { flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair' },
  layer: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
}
