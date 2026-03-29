import React, { useEffect } from 'react'
import useCanvas from '../hooks/useCanvas'

export default function Canvas({ emitDraw }) {
  const { canvasRef, onStart, onMove, onEnd } = useCanvas(emitDraw)

  useEffect(() => {
    const canvas = canvasRef.current
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ flex: 1, background: '#fff', cursor: 'crosshair', display: 'block' }}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
    />
  )
}
