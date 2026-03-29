import { useEffect, useRef } from 'react'
import useRoomStore from '../store/roomStore'

export default function useCanvas(emitDraw) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const { tool, strokes } = useRoomStore()

  // Redraw all strokes whenever strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach(({ x0, y0, x1, y1, color, size, eraser }) => {
      ctx.beginPath()
      ctx.strokeStyle = eraser ? '#ffffff' : color
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    })
  }, [strokes])

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const onStart = (e) => {
    drawing.current = true
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    canvas._last = pos
  }

  const onMove = (e) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    const stroke = {
      x0: canvas._last.x, y0: canvas._last.y,
      x1: pos.x, y1: pos.y,
      color: tool.color, size: tool.size, eraser: tool.eraser
    }
    canvas._last = pos
    useRoomStore.getState().addStroke(stroke)
    emitDraw(stroke)
  }

  const onEnd = () => { drawing.current = false }

  return { canvasRef, onStart, onMove, onEnd }
}
