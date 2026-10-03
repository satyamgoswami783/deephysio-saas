import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { Storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer token & Log
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await Storage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 [API Request] [${config.method?.toUpperCase()}] ${config.baseURL || ''}${config.url || ''}`);
    if (config.data) {
      console.log(`📦 [API Payload]:`, typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 2));
    }
    return config;
  },
  (error) => {
    console.error(`❌ [API Request Config Error]:`, error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 unauthorized & Log Errors
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Success] [${response.config.method?.toUpperCase()}] ${response.config.url} (Status: ${response.status})`);
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const responseData = error.response?.data as any;
    const errorMessage = error.message;

    console.log(`\n🚨 [API Error] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📡 Method & URL: ${method} ${error.config?.baseURL || ''}${url}`);
    console.log(`📊 HTTP Status: ${status || 'Network / Connection Error'}`);
    console.log(`💬 Message: ${errorMessage}`);
    if (responseData) {
      console.log(`📦 Server Response:`, JSON.stringify(responseData, null, 2));
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (status === 401) {
      console.warn(`🔒 [Auth Expired] 401 Unauthorized - Clearing session and redirecting to login`);
      await Storage.clear();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
