import { useEffect, useRef } from 'react'
import useRoomStore from '../store/roomStore'

// Returns the axis-aligned bounding box of a stroke
function strokeBBox(stroke) {
  const pad = (stroke.size || 3) / 2
  if (stroke.mode === 'fill') return { x1: -Infinity, y1: -Infinity, x2: Infinity, y2: Infinity }
  const minX = Math.min(stroke.x0 ?? 0, stroke.x1 ?? 0) - pad
  const minY = Math.min(stroke.y0 ?? 0, stroke.y1 ?? 0) - pad
  const maxX = Math.max(stroke.x0 ?? 0, stroke.x1 ?? 0) + pad
  const maxY = Math.max(stroke.y0 ?? 0, stroke.y1 ?? 0) + pad
  return { x1: minX, y1: minY, x2: maxX, y2: maxY }
}

// True if stroke bbox overlaps selection rect
function strokeInRect(stroke, rx1, ry1, rx2, ry2) {
  const b = strokeBBox(stroke)
  return b.x1 < rx2 && b.x2 > rx1 && b.y1 < ry2 && b.y2 > ry1
}

export default function useCanvas(emitDraw) {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const drawing = useRef(false)
  const startPos = useRef(null)
  const toolRef = useRef(useRoomStore.getState().tool)
  const strokeBatch = useRef([])

  // Selection state
  const selRect = useRef(null)       // { x1,y1,x2,y2 } — the rubber-band rect
  const selIndices = useRef([])      // indices of selected strokes
  const dragStart = useRef(null)     // mouse pos when drag of selection begins
  const isDraggingSel = useRef(false)

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
  const isShape = (mode) => !isFreehand(mode) && mode !== 'fill' && mode !== 'select'

  // ── Draw the dashed selection rectangle on the preview canvas ──
  const drawSelRect = (rect, offset = { dx: 0, dy: 0 }) => {
    const preview = previewRef.current
    if (!preview) return
    const ctx = preview.getContext('2d')
    ctx.clearRect(0, 0, preview.width, preview.height)
    if (!rect) return
    const x = Math.min(rect.x1, rect.x2) + offset.dx
    const y = Math.min(rect.y1, rect.y2) + offset.dy
    const w = Math.abs(rect.x2 - rect.x1)
    const h = Math.abs(rect.y2 - rect.y1)
    ctx.save()
    ctx.strokeStyle = '#7c6af7'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.strokeRect(x, y, w, h)
    ctx.fillStyle = 'rgba(124,106,247,0.08)'
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }

  const onStart = (e) => {
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    const tool = toolRef.current

    // ── Select mode ──
    if (tool.mode === 'select') {
      // Check if clicking inside existing selection to start drag
      if (selRect.current && selIndices.current.length > 0) {
        const r = selRect.current
        const rx1 = Math.min(r.x1, r.x2), ry1 = Math.min(r.y1, r.y2)
        const rx2 = Math.max(r.x1, r.x2), ry2 = Math.max(r.y1, r.y2)
        if (pos.x >= rx1 && pos.x <= rx2 && pos.y >= ry1 && pos.y <= ry2) {
          isDraggingSel.current = true
          dragStart.current = pos
          drawing.current = true
          return
        }
      }
      // Start new rubber-band selection
      selRect.current = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
      selIndices.current = []
      isDraggingSel.current = false
      drawing.current = true
      drawSelRect(selRect.current)
      return
    }

    drawing.current = true
    strokeBatch.current = []
    startPos.current = pos
    canvas._last = pos

    if (tool.mode === 'fill') {
      const stroke = { mode: 'fill', x: pos.x, y: pos.y, color: tool.color, opacity: tool.opacity }
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

    // ── Select: drag existing selection ──
    if (tool.mode === 'select' && isDraggingSel.current) {
      const dx = pos.x - dragStart.current.x
      const dy = pos.y - dragStart.current.y
      drawSelRect(selRect.current, { dx, dy })
      // Redraw strokes with selected ones offset
      const strokes = useRoomStore.getState().strokes
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      strokes.forEach((stroke, i) => {
        if (selIndices.current.includes(i)) {
          drawStroke(ctx, offsetStroke(stroke, dx, dy))
        } else {
          drawStroke(ctx, stroke)
        }
      })
      return
    }

    // ── Select: rubber-band ──
    if (tool.mode === 'select') {
      selRect.current = { ...selRect.current, x2: pos.x, y2: pos.y }
      drawSelRect(selRect.current)
      return
    }

    if (isFreehand(tool.mode)) {
      const stroke = {
        mode: tool.mode, brush: tool.brush,
        x0: canvas._last.x, y0: canvas._last.y,
        x1: pos.x, y1: pos.y,
        color: tool.color, size: tool.size, opacity: tool.opacity,
      }
      canvas._last = pos
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
    const pos = getPos(e, canvas)

    // ── Select: finish drag — commit moved strokes ──
    if (tool.mode === 'select' && isDraggingSel.current) {
      const dx = pos.x - dragStart.current.x
      const dy = pos.y - dragStart.current.y
      const store = useRoomStore.getState()
      const newStrokes = store.strokes.map((stroke, i) =>
        selIndices.current.includes(i) ? offsetStroke(stroke, dx, dy) : stroke
      )
      // Shift the selRect too so it stays around the moved strokes
      selRect.current = {
        x1: selRect.current.x1 + dx, y1: selRect.current.y1 + dy,
        x2: selRect.current.x2 + dx, y2: selRect.current.y2 + dy,
      }
      const newHistory = [...store.history.slice(0, store.historyIndex + 1), newStrokes]
      useRoomStore.setState({ strokes: newStrokes, history: newHistory, historyIndex: newHistory.length - 1 })
      isDraggingSel.current = false
      dragStart.current = null
      drawSelRect(selRect.current)
      return
    }

    // ── Select: finish rubber-band — find strokes inside rect ──
    if (tool.mode === 'select') {
      const r = selRect.current
      if (!r) return
      const rx1 = Math.min(r.x1, r.x2), ry1 = Math.min(r.y1, r.y2)
      const rx2 = Math.max(r.x1, r.x2), ry2 = Math.max(r.y1, r.y2)
      const strokes = useRoomStore.getState().strokes
      selIndices.current = strokes.reduce((acc, s, i) => {
        if (strokeInRect(s, rx1, ry1, rx2, ry2)) acc.push(i)
        return acc
      }, [])
      drawSelRect(selRect.current)
      return
    }

    if (isFreehand(tool.mode) && strokeBatch.current.length > 0) {
      const store = useRoomStore.getState()
      const base = store.strokes.slice(0, store.strokes.length - strokeBatch.current.length)
      const newStrokes = [...base, ...strokeBatch.current]
      const newHistory = [...store.history.slice(0, store.historyIndex + 1), newStrokes]
      useRoomStore.setState({ strokes: newStrokes, history: newHistory, historyIndex: newHistory.length - 1 })
      strokeBatch.current = []
    } else if (isShape(tool.mode)) {
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

  // Clear selection overlay when tool changes away from select
  useEffect(() => {
    return useRoomStore.subscribe(s => {
      if (s.tool.mode !== 'select') {
        selRect.current = null
        selIndices.current = []
        const preview = previewRef.current
        if (preview) preview.getContext('2d').clearRect(0, 0, preview.width, preview.height)
      }
    })
  }, [])

  return { canvasRef, previewRef, onStart, onMove, onEnd }
}

// Apply dx/dy offset to all coordinate fields of a stroke
function offsetStroke(stroke, dx, dy) {
  const s = { ...stroke }
  if (s.x0 != null) { s.x0 += dx; s.y0 += dy }
  if (s.x1 != null) { s.x1 += dx; s.y1 += dy }
  if (s.x  != null) { s.x  += dx; s.y  += dy }
  return s
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

    case 'fill': {
      // Flood-fill from (stroke.x, stroke.y)
      const fillCanvas = ctx.canvas
      const fw = fillCanvas.width, fh = fillCanvas.height
      const imageData = ctx.getImageData(0, 0, fw, fh)
      const data = imageData.data
      const sx = Math.round(stroke.x ?? 0), sy = Math.round(stroke.y ?? 0)
      const idx = (sy * fw + sx) * 4
      const tr = data[idx], tg = data[idx+1], tb = data[idx+2], ta = data[idx+3]
      // Parse target fill color
      const tmp = document.createElement('canvas').getContext('2d')
      tmp.fillStyle = color
      tmp.fillRect(0, 0, 1, 1)
      const [fr, fg, fb] = tmp.getImageData(0, 0, 1, 1).data
      const fa = Math.round(opacity * 255)
      if (tr === fr && tg === fg && tb === fb && ta === fa) break
      const stack = [sx, sy]
      const visited = new Uint8Array(fw * fh)
      while (stack.length) {
        const cx = stack.pop(), cy = stack.pop()
        if (cx < 0 || cx >= fw || cy < 0 || cy >= fh) continue
        const ci = (cy * fw + cx) * 4
        if (visited[cy * fw + cx]) continue
        if (data[ci] !== tr || data[ci+1] !== tg || data[ci+2] !== tb || data[ci+3] !== ta) continue
        visited[cy * fw + cx] = 1
        data[ci] = fr; data[ci+1] = fg; data[ci+2] = fb; data[ci+3] = fa
        stack.push(cx+1, cy, cx-1, cy, cx, cy+1, cx, cy-1)
      }
      ctx.putImageData(imageData, 0, 0)
      break
    }

    default: break
  }

  ctx.restore()
}
