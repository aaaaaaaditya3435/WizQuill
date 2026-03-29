import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useRoomStore from '../store/roomStore'

const SOCKET_URL = 'http://localhost:3000'

export default function useSocket(roomCode, username) {
  const socketRef = useRef(null)
  const { addMessage, addStroke, clearStrokes, setUsers, setStrokes } = useRoomStore()

  useEffect(() => {
    if (!roomCode || !username) return

    const socket = io(SOCKET_URL)
    socketRef.current = socket

    socket.emit('joinRoom', { code: roomCode, username })

    socket.on('strokes', (strokes) => setStrokes(strokes))
    socket.on('history', (msgs) => msgs.forEach(addMessage))
    socket.on('draw', (stroke) => addStroke(stroke))
    socket.on('clear', () => clearStrokes())
    socket.on('chat', (msg) => addMessage(msg))
    socket.on('users', (users) => setUsers(users))

    return () => socket.disconnect()
  }, [roomCode, username])

  const emitDraw = (stroke) => socketRef.current?.emit('draw', stroke)
  const emitClear = () => socketRef.current?.emit('clear')
  const emitChat = (text) => socketRef.current?.emit('chat', text)
  const emitCursor = (pos) => socketRef.current?.emit('cursor', pos)

  return { emitDraw, emitClear, emitChat, emitCursor }
}
