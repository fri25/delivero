import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  quartierId: string | null;
  quartierNom: string | null;
  fraisLivraison: number | null;
  setQuartier: (quartierId: string | null, quartierNom: string | null, fraisLivraison?: number | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      quartierId: null,
      quartierNom: null,
      fraisLivraison: null,
      setQuartier: (quartierId, quartierNom, fraisLivraison = null) =>
        set({ quartierId, quartierNom, fraisLivraison }),
    }),
    { name: 'chapexpress-client-location' },
  ),
);
