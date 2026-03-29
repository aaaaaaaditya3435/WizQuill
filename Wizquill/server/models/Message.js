const { Schema, model } = require('mongoose')

const messageSchema = new Schema({
  roomCode: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = model('Message', messageSchema)
