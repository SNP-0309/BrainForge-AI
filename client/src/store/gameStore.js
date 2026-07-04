import { create } from 'zustand';

export const useGameStore = create((set) => ({
  currentGame: null,
  score: 0,
  timeLeft: 0,
  isGameActive: false,

  startGame: (gameType) => set({ currentGame: gameType, score: 0, isGameActive: true }),
  endGame: () => set({ isGameActive: false, currentGame: null }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setTimeLeft: (time) => set({ timeLeft: time }),
}));
