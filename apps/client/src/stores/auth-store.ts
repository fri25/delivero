import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { queryClient } from '../lib/query-client';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      // Cache cleared on both transitions: the previous account's addresses
      // and orders must never be shown to the next one.
      login: (token, user) => {
        queryClient.clear();
        set({ token, user });
      },
      logout: () => {
        queryClient.clear();
        set({ token: null, user: null });
      },
    }),
    { name: 'delivero-auth' },
  ),
);
