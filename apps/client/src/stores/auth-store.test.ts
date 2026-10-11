import { describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';
import { queryClient } from '../lib/query-client';

const USER = { id: 'u1', telephone: '+2290157866959', nom: 'Awa', role: 'client' };

describe('auth store', () => {
  it('wipes cached data on logout (shared phones)', () => {
    useAuthStore.getState().login('t1', USER);
    queryClient.setQueryData(['adresses'], [{ id: 'a1' }]);
    useAuthStore.getState().logout();
    expect(queryClient.getQueryData(['adresses'])).toBeUndefined();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('wipes cached data on login too (previous account never logged out)', () => {
    queryClient.setQueryData(['mes-commandes'], [{ id: 'c1' }]);
    useAuthStore.getState().login('t2', USER);
    expect(queryClient.getQueryData(['mes-commandes'])).toBeUndefined();
  });
});
