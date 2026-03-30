import { useEffect, useRef } from 'react'
import useRoomStore from '../store/roomStore'

export default function useCanvas(emitDraw) {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const drawing = useRef(false)
  const startPos = useRef(null)
  const toolRef = useRef(useRoomStore.getState().tool)
  const strokeBatch = useRef([]) // accumulate freehand segments before committing to history

  useEffect(() => useRoomStore.subscribe(s => { toolRef.current = s.tool }), [])

  useEffect(() => {
    return useRoomStore.subscribe(s => {
      const canvas = canvasRef.current
      if (canvas) redraw(canvas, s.strokes)
    })
  }, [])

  const redraw = (canvas, strokes) => {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokes.forEach(stroke => drawStroke(ctx, stroke))
  }

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const isFreehand = (mode) => mode === 'pen' || mode === 'eraser'
  const isShape = (mode) => !isFreehand(mode) && mode !== 'fill'

  const onStart = (e) => {
    drawing.current = true
    strokeBatch.current = []
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    startPos.current = pos
    canvas._last = pos

    if (toolRef.current.mode === 'fill') {
      const stroke = { mode: 'fill', color: toolRef.current.color, opacity: toolRef.current.opacity }
      useRoomStore.getState().addStroke(stroke)
      emitDraw(stroke)
      drawing.current = false
    }
  }

  const onMove = (e) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const preview = previewRef.current
    const pos = getPos(e, canvas)
    const tool = toolRef.current

    if (isFreehand(tool.mode)) {
      const stroke = {
        mode: tool.mode, brush: tool.brush,
        x0: canvas._last.x, y0: canvas._last.y,
        x1: pos.x, y1: pos.y,
        color: tool.color, size: tool.size, opacity: tool.opacity,
      }
      canvas._last = pos
      // accumulate without pushing to history yet
      strokeBatch.current.push(stroke)
      useRoomStore.getState().setStrokes([...useRoomStore.getState().strokes, stroke])
      emitDraw(stroke)
    } else if (isShape(tool.mode) && preview && startPos.current) {
      const ctx = preview.getContext('2d')
      ctx.clearRect(0, 0, preview.width, preview.height)
      drawStroke(ctx, {
        mode: tool.mode,
        x0: startPos.current.x, y0: startPos.current.y,
        x1: pos.x, y1: pos.y,
        color: tool.color, size: tool.size, opacity: tool.opacity, fill: tool.fill,
      })
    }
  }

  const onEnd = (e) => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    const preview = previewRef.current
    const tool = toolRef.current

    if (isFreehand(tool.mode) && strokeBatch.current.length > 0) {
      // commit the whole freehand gesture as one history entry
      const store = useRoomStore.getState()
      const base = store.strokes.slice(0, store.strokes.length - strokeBatch.current.length)
      const newStrokes = [...base, ...strokeBatch.current]
      const newHistory = [...store.history.slice(0, store.historyIndex + 1), newStrokes]
      useRoomStore.setState({ strokes: newStrokes, history: newHistory, historyIndex: newHistory.length - 1 })
      strokeBatch.current = []
    } else if (isShape(tool.mode)) {
      const pos = getPos(e, canvas)
      const stroke = {
        mode: tool.mode,
        x0: startPos.current.x, y0: startPos.current.y,
        x1: pos.x, y1: pos.y,
        color: tool.color, size: tool.size, opacity: tool.opacity, fill: tool.fill,
      }
      useRoomStore.getState().addStroke(stroke)
      emitDraw(stroke)
      if (preview) preview.getContext('2d').clearRect(0, 0, preview.width, preview.height)
    }
  }

  return { canvasRef, previewRef, onStart, onMove, onEnd }
}

export function drawStroke(ctx, stroke) {
  const { mode, brush = 'round', color, size = 3, opacity = 1, fill } = stroke
  ctx.save()
  ctx.globalAlpha = opacity

  // ── Eraser ──────────────────────────────────────────────
  if (mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.x0, stroke.y0)
    ctx.lineTo(stroke.x1, stroke.y1)
    ctx.stroke()
    ctx.restore()
    return
  }

  ctx.strokeStyle = color
  ctx.fillStyle = color

  // ── Freehand brushes ────────────────────────────────────
  if (mode === 'pen') {
    switch (brush) {
      case 'square':
        ctx.lineWidth = size
        ctx.lineCap = 'square'
        ctx.lineJoin = 'miter'
        ctx.beginPath()
        ctx.moveTo(stroke.x0, stroke.y0)
        ctx.lineTo(stroke.x1, stroke.y1)
        ctx.stroke()
        break

      case 'calligraphy':
        ctx.lineWidth = size
        ctx.lineCap = 'round'
        // angled stroke — draw a thin line offset
        ctx.save()
        ctx.translate((stroke.x0 + stroke.x1) / 2, (stroke.y0 + stroke.y1) / 2)
        ctx.rotate(Math.PI / 4)
        ctx.scale(1, 0.3)
        ctx.beginPath()
        ctx.moveTo(stroke.x0 - (stroke.x0 + stroke.x1) / 2, stroke.y0 - (stroke.y0 + stroke.y1) / 2)
        ctx.lineTo(stroke.x1 - (stroke.x0 + stroke.x1) / 2, stroke.y1 - (stroke.y0 + stroke.y1) / 2)
        ctx.lineWidth = size * 2.5
        ctx.stroke()
        ctx.restore()
        break

      case 'spray': {
        const dist = Math.hypot(stroke.x1 - stroke.x0, stroke.y1 - stroke.y0)
        const steps = Math.max(1, Math.floor(dist / 2))
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const cx = stroke.x0 + (stroke.x1 - stroke.x0) * t
          const cy = stroke.y0 + (stroke.y1 - stroke.y0) * t
          for (let j = 0; j < 8; j++) {
            const angle = Math.random() * Math.PI * 2
            const r = Math.random() * size * 1.5
            ctx.beginPath()
            ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 0.8, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        break
      }

      case 'dashed':
        ctx.lineWidth = size
        ctx.lineCap = 'round'
        ctx.setLineDash([size * 2, size * 1.5])
        ctx.beginPath()
        ctx.moveTo(stroke.x0, stroke.y0)
        ctx.lineTo(stroke.x1, stroke.y1)
        ctx.stroke()
        ctx.setLineDash([])
        break

      default: // round
        ctx.lineWidth = size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(stroke.x0, stroke.y0)
        ctx.lineTo(stroke.x1, stroke.y1)
        ctx.stroke()
    }
    ctx.restore()
    return
  }

  // ── Shapes ──────────────────────────────────────────────
  ctx.lineWidth = size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (mode) {
    case 'line':
      ctx.beginPath()
      ctx.moveTo(stroke.x0, stroke.y0)
      ctx.lineTo(stroke.x1, stroke.y1)
      ctx.stroke()
      break

    case 'arrow': {
      const dx = stroke.x1 - stroke.x0, dy = stroke.y1 - stroke.y0
      const angle = Math.atan2(dy, dx)
      const head = Math.max(14, size * 3.5)
      ctx.beginPath()
      ctx.moveTo(stroke.x0, stroke.y0)
      ctx.lineTo(stroke.x1, stroke.y1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(stroke.x1, stroke.y1)
      ctx.lineTo(stroke.x1 - head * Math.cos(angle - 0.42), stroke.y1 - head * Math.sin(angle - 0.42))
      ctx.lineTo(stroke.x1 - head * Math.cos(angle + 0.42), stroke.y1 - head * Math.sin(angle + 0.42))
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'rect': {
      const w = stroke.x1 - stroke.x0, h = stroke.y1 - stroke.y0
      ctx.beginPath()
      ctx.roundRect(stroke.x0, stroke.y0, w, h, 4)
      fill ? ctx.fill() : ctx.stroke()
      break
    }

    case 'circle': {
      const rx = Math.abs(stroke.x1 - stroke.x0) / 2
      const ry = Math.abs(stroke.y1 - stroke.y0) / 2
      ctx.beginPath()
      ctx.ellipse((stroke.x0 + stroke.x1) / 2, (stroke.y0 + stroke.y1) / 2, rx || 1, ry || 1, 0, 0, Math.PI * 2)
      fill ? ctx.fill() : ctx.stroke()
      break
    }

    case 'triangle': {
      const mx = (stroke.x0 + stroke.x1) / 2
      ctx.beginPath()
      ctx.moveTo(mx, stroke.y0)
      ctx.lineTo(stroke.x1, stroke.y1)
      ctx.lineTo(stroke.x0, stroke.y1)
      ctx.closePath()
      fill ? ctx.fill() : ctx.stroke()
      break
    }

    case 'star': {
      const cx = (stroke.x0 + stroke.x1) / 2
      const cy = (stroke.y0 + stroke.y1) / 2
      const outerR = Math.max(Math.abs(stroke.x1 - stroke.x0), Math.abs(stroke.y1 - stroke.y0)) / 2
      const innerR = outerR * 0.42
      const points = 5
      ctx.beginPath()
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
                : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      }
      ctx.closePath()
      fill ? ctx.fill() : ctx.stroke()
      break
    }

    case 'fill':
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      break

    default: break
  }

  ctx.restore()
}
