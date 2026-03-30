const router = require('express').Router()
const User = require('../models/User')
const Post = require('../models/Post')
const authMiddleware = require('../middleware/auth')

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select('-password').lean()
  if (!user) return res.status(404).json({ error: 'User not found' })
  const posts = await Post.find({ author: user.username }).sort({ createdAt: -1 }).lean()
  const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0)
  res.json({ username: user.username, bio: user.bio, avatarColor: user.avatarColor, joinedAt: user.createdAt, posts, totalLikes })
})

// PATCH /api/users/me — update own bio / avatarColor
router.patch('/me', authMiddleware, async (req, res) => {
  const { bio, avatarColor } = req.body
  const update = {}
  if (bio !== undefined) update.bio = bio.slice(0, 160)
  if (avatarColor !== undefined) update.avatarColor = avatarColor
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password')
  res.json({ bio: user.bio, avatarColor: user.avatarColor })
})

module.exports = router
