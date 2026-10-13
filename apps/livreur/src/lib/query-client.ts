import { QueryClient } from '@tanstack/react-query';

// Shared instance: the auth store clears it on login/logout (a shared phone
// must never show the previous livreur's courses).
export const queryClient = new QueryClient({
  defaultOptions: {
    // Lists restored from the phone (cache-persistant.ts) must outlive the
    // default 5 min garbage collection, or an offline start shows nothing.
    queries: { gcTime: 24 * 60 * 60 * 1000 },
    // TanStack Query pauses mutations while offline by default: the offline
    // queue (api/hors-ligne.ts) must run them at once to save or refuse them.
    mutations: { networkMode: 'always' },
  },
});
