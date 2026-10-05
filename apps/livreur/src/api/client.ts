import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth-store';

const API_URL =import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();

  // Jeton expiré ou révoqué : sans cela, les listes interrogées toutes les 8 s
  // échouent en silence et le livreur reste sur un écran mort. Seulement si un
  // jeton a été envoyé — un 401 au login (mauvais mot de passe) n'est pas une
  // session expirée. Le logout vide le store, ProtectedRoute redirige.
  if (response.status === 401 && token) {
    const { logout } = useAuthStore.getState();
    if (useAuthStore.getState().token) {
      logout();
      toast.error('Session expirée, reconnectez-vous.');
    }
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorBody;
    const message = Array.isArray(errorBody.message) ? errorBody.message.join(' ') : errorBody.message;
    throw new ApiError(errorBody.statusCode, errorBody.error, message);
  }

  return data as T;
}
