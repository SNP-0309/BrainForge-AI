import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
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

export default api;
