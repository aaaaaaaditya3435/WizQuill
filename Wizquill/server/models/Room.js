const { Schema, model } = require('mongoose')

const roomSchema = new Schema({
  code: { type: String, required: true, unique: true },
  strokes: { type: Array, default: [] },
  users: { type: [String], default: [] },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
})

roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = model('Room', roomSchema)
