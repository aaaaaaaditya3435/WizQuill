import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Feed from './pages/Feed'
import CanvasEntry from './pages/CanvasEntry'
import Room from './pages/Room'
import Profile from './pages/Profile'
import useRoomStore from './store/roomStore'
import useAuthStore from './store/authStore'

function Protected({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  const theme = useRoomStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<Protected><Feed /></Protected>} />
        <Route path="/canvas" element={<Protected><CanvasEntry /></Protected>} />
        <Route path="/room/:code" element={<Protected><Room /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/profile/:username" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
