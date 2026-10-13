import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { queryClient } from '../lib/query-client';
import { effacer } from '../lib/stockage-local';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// A shared phone must never show the previous livreur's courses: the
// in-memory cache and the lists saved on the phone are cleared on both
// transitions. The offline action queue is kept — each action carries its
// userId and is only replayed for its own account.
function oublierDonnees() {
  queryClient.clear();
  void effacer('cache-requetes');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => {
        oublierDonnees();
        set({ token, user });
      },
      logout: () => {
        oublierDonnees();
        set({ token: null, user: null });
      },
    }),
    { name: 'delivero-livreur-auth' },
  ),
);
