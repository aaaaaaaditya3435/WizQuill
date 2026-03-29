const router = require('express').Router()
const Room = require('../models/Room')

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// POST /api/rooms — create room
router.post('/', async (req, res) => {
  const code = genCode()
  const room = await Room.create({ code, users: [req.body.username] })
  res.json({ code: room.code })
})

// POST /api/rooms/:code/join — join room
router.post('/:code/join', async (req, res) => {
  const room = await Room.findOne({ code: req.params.code })
  if (!room) return res.status(404).json({ error: 'Room not found' })

  if (!room.users.includes(req.body.username)) {
    room.users.push(req.body.username)
    await room.save()
  }
  res.json({ code: room.code })
})

module.exports = router
