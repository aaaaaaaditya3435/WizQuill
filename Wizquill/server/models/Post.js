const { Schema, model } = require('mongoose')

const commentSchema = new Schema({
  author: { type: String, required: true },
  text:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

const postSchema = new Schema({
  author:   { type: String, required: true },
  title:    { type: String, default: 'Untitled' },
  image:    { type: String, required: true },   // base64 data URL
  likes:    { type: [String], default: [] },     // array of usernames
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true })

module.exports = model('Post', postSchema)
