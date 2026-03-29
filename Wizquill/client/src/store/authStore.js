import { create } from 'zustand'

const stored = JSON.parse(localStorage.getItem('wq_auth') || 'null')

const useAuthStore = create((set) => ({
  token: stored?.token || null,
  username: stored?.username || null,

  login: (token, username) => {
    localStorage.setItem('wq_auth', JSON.stringify({ token, username }))
    set({ token, username })
  },
  logout: () => {
    localStorage.removeItem('wq_auth')
    set({ token: null, username: null })
  },
}))

export default useAuthStore
