import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Role = 'admin' | 'viewer' | null;

interface AuthState {
  role: Role;
  password: string | null;
  isAuthenticated: boolean;
  setAuth: (password: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      password: null,
      isAuthenticated: false,
      setAuth: (password, role) => set({ password, role, isAuthenticated: !!role }),
      logout: () => set({ role: null, password: null, isAuthenticated: false }),
    }),
    {
      name: 'vendex-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
