const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/rooms', require('./routes/rooms'))

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } })

require('./socket')(io)

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/makeitio'

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected')
  server.listen(3000, () => console.log('Server running on http://localhost:3000'))
}).catch(err => { console.error('MongoDB error:', err); process.exit(1) })
