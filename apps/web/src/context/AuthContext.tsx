import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api'; import type { User } from '../types';
interface AuthValue { user: User | null; loading: boolean; login(email: string, password: string): Promise<void>; register(data: Record<string, string>): Promise<void>; logout(): Promise<void>; }
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api<{data:{user:User}}>('/auth/me').then(r => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = async (email: string, password: string) => { const r = await api<{data:{user:User}}>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setUser(r.data.user); };
  const register = async (data: Record<string,string>) => { const r = await api<{data:{user:User}}>('/auth/register', { method: 'POST', body: JSON.stringify(data) }); setUser(r.data.user); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth requires AuthProvider'); return value; };
