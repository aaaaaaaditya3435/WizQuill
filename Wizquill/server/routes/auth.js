const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const SECRET = process.env.JWT_SECRET || 'wizquill_secret'

const sign = (user) => jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body
  if (!username?.trim() || !password?.trim())
    return res.status(400).json({ error: 'Username and password required' })
  if (await User.findOne({ username }))
    return res.status(409).json({ error: 'Username already taken' })
  const user = await User.create({ username, password })
  res.json({ token: sign(user), username: user.username })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ token: sign(user), username: user.username })
})

module.exports = router
