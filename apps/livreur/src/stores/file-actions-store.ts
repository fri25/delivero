import { create } from 'zustand';
import type { ActionEnFile } from '@/lib/rejeu';
import { ecrire, lire } from '@/lib/stockage-local';

const CLE = 'file-actions';

interface FileActionsState {
  actions: ActionEnFile[];
  /** False until the queue saved on the phone has been read back. */
  chargee: boolean;
  synchronisation: boolean;
  charger: () => Promise<void>;
  ajouter: (action: ActionEnFile) => void;
  retirer: (ids: string[]) => void;
  marquerRefusees: (refusees: { id: string; erreur: string }[]) => void;
  /** Clears the refusal so the next sync tries it again. */
  reessayer: (id: string) => void;
  abandonner: (id: string) => void;
  setSynchronisation: (enCours: boolean) => void;
}

/**
 * Offline action queue (docs/pwa-offline.md), saved in IndexedDB after every
 * change so it survives the app being closed while offline.
 */
export const useFileActionsStore = create<FileActionsState>()((set, get) => {
  const sauver = (actions: ActionEnFile[]) => {
    set({ actions });
    void ecrire(CLE, actions);
  };
  return {
    actions: [],
    chargee: false,
    synchronisation: false,
    charger: async () => {
      if (get().chargee) return;
      const enregistrees = (await lire<ActionEnFile[]>(CLE)) ?? [];
      // Keep anything queued while loading (unlikely, but never drop work).
      set({ actions: [...enregistrees, ...get().actions], chargee: true });
    },
    ajouter: (action) => sauver([...get().actions, action]),
    retirer: (ids) => sauver(get().actions.filter((action) => !ids.includes(action.id))),
    marquerRefusees: (refusees) =>
      sauver(
        get().actions.map((action) => {
          const refus = refusees.find((r) => r.id === action.id);
          return refus ? { ...action, erreur: refus.erreur } : action;
        }),
      ),
    reessayer: (id) =>
      sauver(get().actions.map((action) => (action.id === id ? { ...action, erreur: undefined } : action))),
    abandonner: (id) => sauver(get().actions.filter((action) => action.id !== id)),
    setSynchronisation: (synchronisation) => set({ synchronisation }),
  };
});
