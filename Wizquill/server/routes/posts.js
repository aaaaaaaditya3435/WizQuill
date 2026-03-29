const router = require('express').Router()
const Post = require('../models/Post')
const authMiddleware = require('../middleware/auth')

// GET /api/posts — all posts newest first
router.get('/', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean()
  res.json(posts)
})

// POST /api/posts — create post (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const { title, image } = req.body
  if (!image) return res.status(400).json({ error: 'Image required' })
  const post = await Post.create({ author: req.user.username, title: title || 'Untitled', image })
  res.json(post)
})

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  const u = req.user.username
  const idx = post.likes.indexOf(u)
  idx === -1 ? post.likes.push(u) : post.likes.splice(idx, 1)
  await post.save()
  res.json({ likes: post.likes })
})

// POST /api/posts/:id/comment — add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' })
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  post.comments.push({ author: req.user.username, text })
  await post.save()
  res.json(post.comments)
})

// DELETE /api/posts/:id — delete own post
router.delete('/:id', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  if (post.author !== req.user.username) return res.status(403).json({ error: 'Forbidden' })
  await post.deleteOne()
  res.json({ ok: true })
})

module.exports = router
