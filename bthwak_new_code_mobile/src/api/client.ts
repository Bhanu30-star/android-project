/* eslint-disable import/no-named-as-default-member */
import axios, { AxiosError, isAxiosError } from 'axios';
import { Platform } from 'react-native';
import { getAuthToken } from '../utils/secureStore';

const DEFAULT_API_URL = 'https://app.bthawk.com/api/v1';

export const getBaseUrl = (): string => {
  // If running in browser on localhost (Expo Web dev server), use relative '/api/v1' to route through Metro's CORS proxy
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/api/v1';
  }
  return process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
};

export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to attach auth token to request:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function parseApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string; error?: string; status?: boolean }>;
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
      return 'Connection timed out. Please check your network connection and server status.';
    }
    if (axiosErr.message === 'Network Error' || !axiosErr.response) {
      return 'Unable to connect to the server. Please check your internet connection or API URL.';
    }
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr.response?.data?.error) {
      return axiosErr.response.data.error;
    }
    if (axiosErr.response?.status === 401) {
      return 'Unauthorized. Please log in again.';
    }
    if (axiosErr.response?.status === 422) {
      return 'Invalid request details. Please check your inputs.';
    }
    return `Server error (${axiosErr.response?.status || 'Unknown'})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
