import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bf66-3-110-153-18.ngrok-free.app';

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// ===== JWT DISABLED =====
// Auth header injection and refresh logic disabled.
// To re-enable: uncomment the request interceptor below and the refresh logic in the response interceptor.

axiosClient.interceptors.request.use(async (config) => {
  // JWT disabled — no auth header injected
  // const token = await AsyncStorage.getItem('authToken');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  console.log('🟢 API Request:', {
    method: config.method,
    url: config.url,
    fullUrl: config.baseURL + config.url,
  });
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    console.log('🔵 API Response:', { status: response.status, data: response.data });
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    // Log non-auth errors
    if (status !== 401 && status !== 403) {
      console.error('🔴 API Error:', {
        message: error.message,
        status,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  }
);

export default axiosClient;