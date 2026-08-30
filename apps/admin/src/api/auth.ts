import { useMutation } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { AuthResponse } from './types';

interface LoginInput {
  telephone: string;
  motDePasse: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginInput) => apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: dto }),
  });
}
