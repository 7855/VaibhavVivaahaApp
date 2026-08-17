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
  // Dev-only: serializing every request/response body on the JS thread costs real frames
  // during screen loads, and full response bodies (profiles, chats, OTPs) are PII that must
  // never reach logcat in a release build.
  if (__DEV__) {
    console.log('🟢 API Request:', {
      method: config.method,
      url: config.url,
      fullUrl: config.baseURL + config.url,
    });
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('🔵 API Response:', { status: response.status, data: response.data });
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    // Log non-auth errors. 413 is logged compactly on purpose: it comes back from nginx as a
    // full HTML error page, and dumping that into the console buries the one useful fact.
    if (__DEV__ && status !== 401 && status !== 403) {
      if (status === 413) {
        console.error('🔴 API Error: 413 Request Entity Too Large —', error.config?.url,
          '(nginx client_max_body_size; images should be compressed before upload)');
      } else {
        console.error('🔴 API Error:', {
          message: error.message,
          status,
          data: error.response?.data,
        });
      }
    }
    // Give callers something readable to show. Without this every `res.data.message` lookup on a
    // 413 yields a chunk of nginx HTML, which is what the user would end up seeing in a popup.
    if (status === 413 && error.response) {
      error.response.data = {
        code: 413,
        status: 'FAILURE',
        message: 'That file is too large to upload. Please choose a smaller image.',
      };
    }
    return Promise.reject(error);
  }
);

export default axiosClient;