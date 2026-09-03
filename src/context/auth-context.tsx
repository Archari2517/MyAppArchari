import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// เปลี่ยน host/port ตรงนี้ให้ตรงกับ backend จริง (ตัวเดียวกับที่ index.tsx ใช้)
export const API_BASE_URL = 'http://119.59.102.161:3068/api';
const LOGIN_URL = `${API_BASE_URL}/login`;
const STORAGE_KEY = 'auth_user';

export type Role = 'admin' | 'user';

export interface AuthUser {
  id: number;
  user_name: string;
  email: string | null;
  phone?: string | null;
  role: Role;
  user_img: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<AuthUser>) => Promise<void>; // 👈 เพิ่มฟังก์ชันอัปเดตข้อมูล
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด session ที่เคย login ค้างไว้ (ถ้ามี) ตอนเปิดแอป
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch (error) {
        console.error('Load session error:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, message: data?.error || 'เข้าสู่ระบบไม่สำเร็จ' };
      }

      const loggedInUser: AuthUser = data.user;
      setUser(loggedInUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง' };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // 🔹 เพิ่มฟังก์ชันสำหรับอัปเดต state + AsyncStorage เมื่อมีการแก้โปรไฟล์หรือรูปภาพ
  const updateUser = async (updatedData: Partial<AuthUser>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser, // 👈 ส่งออกมาใช้งาน
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth ต้องถูกเรียกใช้ภายใน <AuthProvider>');
  }
  return ctx;
}