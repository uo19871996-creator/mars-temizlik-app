import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token: authToken, user: userData } = response.data;
      
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Giriş başarısız');
    }
  };

  const register = async (email: string, password: string, full_name: string, phone: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        email,
        password,
        full_name,
        phone,
      });

      const { token: authToken, user: userData } = response.data;
      
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Kayıt başarısız');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
