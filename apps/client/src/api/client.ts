import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth-store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'message' in data;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on network failure (offline, DNS, dropped 3G link).
    throw new ApiError(0, 'NetworkError', 'Connexion impossible. Vérifiez votre réseau et réessayez.');
  }

  // Expired or revoked session. Only drop the session that made this request:
  // a stale in-flight call must not log out an account that signed in since.
  if (response.status === 401 && token && useAuthStore.getState().token === token) {
    useAuthStore.getState().logout();
    toast.info('Votre session a expiré. Reconnectez-vous.', { id: 'session-expiree' });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  // A proxy or gateway error (502/504 on an unstable link) returns HTML, not
  // JSON; a handler returning nothing answers 200 with an empty body.
  let data: unknown;
  try {
    const texte = await response.text();
    if (!texte && response.ok) {
      return undefined as T;
    }
    data = JSON.parse(texte);
  } catch {
    throw new ApiError(
      response.status,
      'InvalidResponse',
      'Le service est momentanément indisponible. Réessayez dans un instant.',
    );
  }

  if (!response.ok) {
    if (!isApiErrorBody(data)) {
      throw new ApiError(response.status, 'UnknownError', 'Une erreur est survenue. Réessayez.');
    }
    const message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    throw new ApiError(data.statusCode ?? response.status, data.error, message);
  }

  return data as T;
}
