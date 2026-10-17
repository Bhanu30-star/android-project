import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'bthawk_auth_token';
const USER_KEY = 'bthawk_user_data';

const isWeb = Platform.OS === 'web';

export async function saveAuthToken(token: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error deleting auth token:', error);
  }
}

export async function saveUserData(userData: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(userData);
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_KEY, serialized);
      }
    } else {
      await SecureStore.setItemAsync(USER_KEY, serialized);
    }
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

export async function getUserData<T = unknown>(): Promise<T | null> {
  try {
    let dataStr: string | null = null;
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        dataStr = window.localStorage.getItem(USER_KEY);
      }
    } else {
      dataStr = await SecureStore.getItemAsync(USER_KEY);
    }
    if (!dataStr) return null;
    return JSON.parse(dataStr) as T;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await removeAuthToken();
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(USER_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}
