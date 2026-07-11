import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is the loopback address for the host machine in Android Emulator
const defaultBaseUrl = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  ios: 'http://localhost:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

const api = axios.create({
  baseURL: defaultBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT tokens into all outgoing requests if present
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('API Interceptor: Could not fetch token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
