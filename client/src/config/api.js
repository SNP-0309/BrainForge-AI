import axios from 'axios';
import { auth, logoutUser } from './firebase';
import { useToastStore } from '../store/toastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error('Failed to get Firebase token:', e.message);
    }
  } else {
    // Developer mock token support for local offline development
    const mockToken = localStorage.getItem('mock_token');
    if (mockToken) {
      config.headers.Authorization = `Bearer ${mockToken}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Trigger visual toast error notification
    useToastStore.getState().showToast(message, 'error');

    // Handle 401 Unauthorized (session expired / token invalid)
    if (error.response?.status === 401) {
      try {
        await logoutUser();
      } catch (e) {
        console.error('Failed to logout user after 401:', e.message);
      }
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
