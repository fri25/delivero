import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Operateur {
  id: string;
  nom: string;
  telephone: string | null;
}

interface AuthState {
  token: string | null;
  operateur: Operateur | null;
  connecter: (token: string, operateur: Operateur) => void;
  deconnecter: () => void;
}

// Session storage: a platform session ends with the browser tab.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      operateur: null,
      connecter: (token, operateur) => set({ token, operateur }),
      deconnecter: () => set({ token: null, operateur: null }),
    }),
    {
      name: 'rapidliv-plateforme-auth',
      storage: {
        getItem: (cle) => {
          const valeur = sessionStorage.getItem(cle);
          return valeur ? JSON.parse(valeur) : null;
        },
        setItem: (cle, valeur) => sessionStorage.setItem(cle, JSON.stringify(valeur)),
        removeItem: (cle) => sessionStorage.removeItem(cle),
      },
    },
  ),
);
