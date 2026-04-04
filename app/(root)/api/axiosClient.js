import axios from 'axios';

// Get the API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.250:9100';

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add these options to help with network issues
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

axiosClient.interceptors.request.use(async config => {
  // Log detailed request info
  console.log('🟢 API Request:', {
    method: config.method,
    url: config.url,
    fullUrl: config.baseURL + config.url,
    headers: config.headers,
    data: config.data
  });

  return config;
});

axiosClient.interceptors.response.use(
  response => {
    console.log('🔵 API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('🔴 API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      request: error.request
    });
    return Promise.reject(error);
  }
);

export default axiosClient;
