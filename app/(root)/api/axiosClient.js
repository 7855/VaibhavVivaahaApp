import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.46.223.75:9100';

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// ===== Refresh-token queue =====
// While a refresh is in flight, we queue any 401 requests and replay them
// once a new access token is available. This avoids hammering /auth/refresh
// from N parallel failing requests.
let isRefreshing = false;
let refreshQueue = [];

const subscribeTokenRefresh = (cb) => {
  refreshQueue.push(cb);
};

const onRefreshed = (newToken) => {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
};

const forceLogout = async () => {
  try {
    await AsyncStorage.multiRemove([
      'authToken',
      'refreshToken',
      'userData',
      'userStatus',
      'rejectionReason',
    ]);
  } catch (_) {}
  try {
    router.replace('/(root)/(main)/LoginScreen');
  } catch (_) {}
};

axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
    const originalRequest = error.config;
    const status = error.response?.status;

    // Skip refresh logic for the refresh endpoint itself
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');
    const isLoginCall = originalRequest?.url?.includes('/user/login') || originalRequest?.url?.includes('/auth/');

    if ((status === 401 || status === 403) && !originalRequest._retry && !isRefreshCall && !isLoginCall) {
      originalRequest._retry = true;

      // If a refresh is already in progress, wait for it and replay
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          await forceLogout();
          onRefreshed(null);
          return Promise.reject(error);
        }

        const refreshResp = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const data = refreshResp.data?.data;
        const newAccessToken = data?.token;
        const newRefreshToken = data?.refreshToken;

        if (refreshResp.data?.code === 200 && newAccessToken) {
          await AsyncStorage.setItem('authToken', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }
          onRefreshed(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        }

        await forceLogout();
        onRefreshed(null);
        return Promise.reject(error);
      } catch (refreshErr) {
        console.error('🔴 Refresh failed:', refreshErr?.message);
        await forceLogout();
        onRefreshed(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    console.error('🔴 API Error:', {
      message: error.message,
      status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default axiosClient;
