import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export interface User {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profile: {
    avatar: string;
    xp: number;
    level: number;
    coins: number;
    dailyStreak: number;
    lastActive: string;
    chosenCareerPath?: string;
    assessmentCompleted?: boolean;
    assessmentRecommendations?: any[];
    dailyMission?: {
      date: string;
      tasks: { id: string; label: string; completed: boolean; type: string }[];
      claimed: boolean;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, role: 'student' | 'teacher' | 'admin') => Promise<void>;
  register: (name: string, email: string, firebaseUid: string, role: 'student' | 'teacher') => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, role) => {
    set({ isLoading: true, error: null });
    try {
      // Create a mock token compatible with verifyFirebaseToken middleware in development/test environments
      // e.g., mock-student-john or mock-teacher-jane
      const username = email.split('@')[0];
      const mockToken = `mock-${role}-${username}`;
      
      const response = await api.post(
        '/auth/sync',
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      
      const { user } = response.data.data;

      // Save credentials locally
      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Inject authorization header globally
      api.defaults.headers.common.Authorization = `Bearer ${mockToken}`;

      set({
        user,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Mobile AuthStore: Sync failed', error);
      const errMsg = error.response?.data?.message || 'Authentication sync failed.';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  register: async (name, email, firebaseUid, role) => {
    set({ isLoading: true, error: null });
    try {
      const username = email.split('@')[0];
      const mockToken = `mock-${role}-${username}`;

      const response = await api.post(
        '/auth/sync',
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );

      const { user } = response.data.data;

      // Update name if customized
      if (name && name !== user.name) {
        api.defaults.headers.common.Authorization = `Bearer ${mockToken}`;
        const updateResponse = await api.put('/users/me', { name });
        if (updateResponse.data && updateResponse.data.data) {
          user.name = updateResponse.data.data.name;
        }
      }

      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common.Authorization = `Bearer ${mockToken}`;

      set({
        user,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Mobile AuthStore: Registration failed', error);
      const errMsg = error.response?.data?.message || 'Registration sync failed.';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear token header
      delete api.defaults.headers.common.Authorization;

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to logout' });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => set({ user }),
  clearError: () => set({ error: null }),
}));
