import { QueryClient } from '@tanstack/react-query';

// Shared instance so the auth store can wipe cached data on login/logout:
// query keys like ['adresses'] or ['mes-commandes'] are not scoped by user,
// and a phone is often shared between several accounts.
export const queryClient = new QueryClient();
