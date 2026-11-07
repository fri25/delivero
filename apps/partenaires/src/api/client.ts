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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Expired or revoked session (JWT lasts 2h in production). Without this the
  // stale token stays in storage and every screen fails. Only drop the session
  // that made this request: a stale in-flight call must not log out an account
  // that signed in since. The route guard then redirects to the login page.
  if (response.status === 401 && token && useAuthStore.getState().token === token) {
    useAuthStore.getState().logout();
    toast.info('Votre session a expiré. Reconnectez-vous.', { id: 'session-expiree' });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorBody = data as ApiErrorBody;
    const message = Array.isArray(errorBody.message) ? errorBody.message.join(' ') : errorBody.message;
    throw new ApiError(errorBody.statusCode, errorBody.error, message);
  }

  return data as T;
}
