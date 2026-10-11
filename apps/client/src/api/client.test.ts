import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError } from './client';
import { useAuthStore } from '../stores/auth-store';

const USER = { id: 'u1', telephone: '+2290157866959', nom: 'Awa', role: 'client' };

function repondre(corps: string, status = 200, contentType = 'application/json') {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(corps, { status, headers: { 'Content-Type': contentType } }));
}

describe('apiFetch', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('returns the parsed JSON body and sends the bearer token', async () => {
    const fetchMock = repondre('{"ok":true}');
    await expect(apiFetch('/x', { token: 'abc' })).resolves.toEqual({ ok: true });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer abc' });
  });

  it('returns undefined for an empty 200 body (DELETE handlers)', async () => {
    repondre('');
    await expect(apiFetch('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('joins NestJS validation messages', async () => {
    repondre('{"statusCode":400,"error":"Bad Request","message":["a requis","b requis"]}', 400);
    await expect(apiFetch('/x')).rejects.toMatchObject({ statusCode: 400, message: 'a requis b requis' });
  });

  it('turns a network failure into a readable French error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiFetch('/x')).rejects.toMatchObject({
      statusCode: 0,
      message: expect.stringContaining('Connexion impossible'),
    });
  });

  it('turns an HTML gateway error into a readable error', async () => {
    repondre('<html>502 Bad Gateway</html>', 502, 'text/html');
    const erreur = await apiFetch('/x').catch((e: unknown) => e);
    expect(erreur).toBeInstanceOf(ApiError);
    expect((erreur as ApiError).message).toContain('momentanément indisponible');
  });

  it('logs out on 401 for the current session', async () => {
    useAuthStore.setState({ token: 'courant', user: USER });
    repondre('{"statusCode":401,"error":"Unauthorized","message":"Token invalide ou expiré."}', 401);
    await expect(apiFetch('/x', { token: 'courant' })).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('keeps a newer session when a stale request gets a 401', async () => {
    useAuthStore.setState({ token: 'nouveau', user: USER });
    repondre('{"statusCode":401,"error":"Unauthorized","message":"Token invalide ou expiré."}', 401);
    await expect(apiFetch('/x', { token: 'ancien' })).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBe('nouveau');
  });
});
