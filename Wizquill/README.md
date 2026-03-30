# WizQuill

Real-time collaborative whiteboard + chat and blogging.

## Stack
- **Frontend**: React + Vite, React Router, Zustand, HTML5 Canvas
- **Backend**: Express, Socket.io, MongoDB (Mongoose)

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017 (or set `MONGO_URI` env var)

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Features
- Create / join rooms via REST API
- Real-time drawing synced via Socket.io
- Strokes persisted in MongoDB, replayed on join
- Chat with message history
- Live user presence list
- Eraser, color picker, brush size
- Rooms auto-expire after 24h (MongoDB TTL index)
