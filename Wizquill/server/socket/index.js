const Room = require('../models/Room')
const Message = require('../models/Message')

// roomCode -> Map<socketId, username>
const roomUsers = {}

module.exports = (io) => {
  io.on('connection', (socket) => {
    let currentRoom = null
    let currentUser = null

    socket.on('joinRoom', async ({ code, username }) => {
      socket.join(code)
      currentRoom = code
      currentUser = username

      if (!roomUsers[code]) roomUsers[code] = {}
      roomUsers[code][socket.id] = username

      // Send existing strokes to the new user
      const room = await Room.findOne({ code })
      if (room) socket.emit('strokes', room.strokes)

      // Send recent messages
      const msgs = await Message.find({ roomCode: code }).sort({ createdAt: -1 }).limit(50).lean()
      socket.emit('history', msgs.reverse())

      broadcastUsers(code)
      io.to(code).emit('chat', { system: true, text: `${username} joined` })
    })

    socket.on('draw', async (stroke) => {
      if (!currentRoom) return
      socket.to(currentRoom).emit('draw', stroke)
      await Room.updateOne({ code: currentRoom }, { $push: { strokes: stroke } })
    })

    socket.on('clear', async () => {
      if (!currentRoom) return
      io.to(currentRoom).emit('clear')
      await Room.updateOne({ code: currentRoom }, { $set: { strokes: [] } })
    })

    socket.on('chat', async (text) => {
      if (!currentRoom || !currentUser) return
      const msg = { user: currentUser, text, system: false }
      io.to(currentRoom).emit('chat', msg)
      await Message.create({ roomCode: currentRoom, user: currentUser, text })
    })

    socket.on('cursor', (pos) => {
      if (!currentRoom) return
      socket.to(currentRoom).emit('cursor', { id: socket.id, user: currentUser, ...pos })
    })

    socket.on('disconnect', () => {
      if (!currentRoom) return
      delete roomUsers[currentRoom]?.[socket.id]
      broadcastUsers(currentRoom)
      if (currentUser) io.to(currentRoom).emit('chat', { system: true, text: `${currentUser} left` })
    })

    function broadcastUsers(code) {
      const users = Object.values(roomUsers[code] || {})
      io.to(code).emit('users', users)
    }
  })
}
