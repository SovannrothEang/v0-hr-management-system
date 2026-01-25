import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "hr_manager" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  employeeId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      updateTokens: (token, refreshToken) => 
        set({ token, refreshToken }),
    }),
    {
      name: "hrflow-auth",
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
