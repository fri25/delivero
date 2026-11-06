import { useAuthStore } from '@/stores/auth-store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/**
 * /api/plateforme only. No X-Tenant: the API never binds these routes to a
 * company (TenantMiddleware). A 401 or 403 ends the session.
 */
export async function api<T>(chemin: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const recherche = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query)
          .filter((e): e is [string, string | number] => e[1] !== undefined && e[1] !== '')
          .map(([cle, valeur]): [string, string] => [cle, String(valeur)]),
      ).toString()
    : '';

  const reponse = await fetch(`${API_URL}/plateforme${chemin}${recherche}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const donnees: unknown = reponse.status === 204 ? undefined : await reponse.json().catch(() => undefined);
  if (!reponse.ok) {
    if ((reponse.status === 401 || reponse.status === 403) && token) {
      useAuthStore.getState().deconnecter();
    }
    const message = (donnees as { message?: string | string[] } | undefined)?.message;
    throw new ApiError(reponse.status, Array.isArray(message) ? message.join(' ') : (message ?? 'Erreur inattendue.'));
  }
  return donnees as T;
}
