import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,        // Local MongoDB user document
  firebaseUser: null, // Firebase Auth user object
  loading: true,

  setLoading: (loading) => set({ loading }),

  setFirebaseUser: (fbUser) => set({ firebaseUser: fbUser }),

  setUser: (user) => set({ user }),

  clearAuth: () => set({ user: null, firebaseUser: null, loading: false }),
}));
