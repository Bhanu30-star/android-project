import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  getAuthToken,
  saveAuthToken,
  clearAuth,
  getUserData,
  saveUserData,
} from '../utils/secureStore';
import { logoutApi } from '../api/auth';

export interface DecodedAuthPayload {
  distributor_id?: number | string;
  user_id?: number | string;
  user_role?: string;
  work_type?: string;
  distributor_name?: string;
  distributor_firm_name?: string;
  distributor_email?: string;
  distributor_mobile_no?: string;
  distributor_renewal_datetime?: string;
  place_of_supply?: string;
  login_type?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

interface AuthContextType {
  token: string | null;
  user: DecodedAuthPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  loginWithToken: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedAuthPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      try {
        const storedToken = await getAuthToken();
        if (!isMounted) return;

        if (storedToken) {
          try {
            const decoded = jwtDecode<DecodedAuthPayload>(storedToken);
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              await clearAuth();
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
            } else if (isMounted) {
              setToken(storedToken);
              setUser(decoded);
            }
          } catch {
            const cachedUser = await getUserData<DecodedAuthPayload>();
            if (cachedUser && isMounted) {
              setToken(storedToken);
              setUser(cachedUser);
            } else {
              await clearAuth();
            }
          }
        }
      } catch (err) {
        console.error('Error restoring auth state:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithToken = async (newToken: string) => {
    await saveAuthToken(newToken);
    setToken(newToken);
    try {
      const decoded = jwtDecode<DecodedAuthPayload>(newToken);
      setUser(decoded);
      await saveUserData(decoded);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API logout errors during local sign-out
    } finally {
      await clearAuth();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated: !!token,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
