import { create } from 'zustand'

const useRoomStore = create((set) => ({
  roomCode: null,
  username: '',
  users: [],
  messages: [],
  strokes: [],
  theme: 'dark',
  tool: {
    color: '#a78bfa',
    size: 4,
    opacity: 1,
    mode: 'pen',
    brush: 'round',   // round | square | calligraphy | spray | dashed
    fill: false,
  },

  setRoom: (code) => set({ roomCode: code }),
  setUsername: (username) => set({ username }),
  setUsers: (users) => set({ users }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  setStrokes: (strokes) => set({ strokes }),
  clearStrokes: () => set({ strokes: [] }),
  setTool: (patch) => set((s) => ({ tool: { ...s.tool, ...patch } })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}))

export default useRoomStore
