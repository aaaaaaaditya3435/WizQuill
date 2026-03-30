import { create } from 'zustand'

const useRoomStore = create((set, get) => ({
  roomCode: null,
  username: '',
  users: [],
  messages: [],
  strokes: [],
  history: [[]], // stack of stroke snapshots
  historyIndex: 0,
  theme: 'dark',
  tool: {
    color: '#a78bfa',
    size: 4,
    opacity: 1,
    mode: 'pen',
    brush: 'round',
    fill: false,
  },

  setRoom: (code) => set({ roomCode: code }),
  setUsername: (username) => set({ username }),
  setUsers: (users) => set({ users }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addStroke: (stroke) => set((s) => {
    const newStrokes = [...s.strokes, stroke]
    const newHistory = [...s.history.slice(0, s.historyIndex + 1), newStrokes]
    return { strokes: newStrokes, history: newHistory, historyIndex: newHistory.length - 1 }
  }),
  setStrokes: (strokes) => set({ strokes }),
  clearStrokes: () => set((s) => {
    const newHistory = [...s.history.slice(0, s.historyIndex + 1), []]
    return { strokes: [], history: newHistory, historyIndex: newHistory.length - 1 }
  }),
  undo: () => set((s) => {
    if (s.historyIndex <= 0) return {}
    const idx = s.historyIndex - 1
    return { historyIndex: idx, strokes: s.history[idx] }
  }),
  redo: () => set((s) => {
    if (s.historyIndex >= s.history.length - 1) return {}
    const idx = s.historyIndex + 1
    return { historyIndex: idx, strokes: s.history[idx] }
  }),
  setTool: (patch) => set((s) => ({ tool: { ...s.tool, ...patch } })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}))

export default useRoomStore
