import { create } from 'zustand'

const useRoomStore = create((set) => ({
  roomCode: null,
  username: '',
  users: [],
  messages: [],
  strokes: [],
  tool: { color: '#000000', size: 4, eraser: false },

  setRoom: (code) => set({ roomCode: code }),
  setUsername: (username) => set({ username }),
  setUsers: (users) => set({ users }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  setStrokes: (strokes) => set({ strokes }),
  clearStrokes: () => set({ strokes: [] }),
  setTool: (patch) => set((s) => ({ tool: { ...s.tool, ...patch } })),
}))

export default useRoomStore
