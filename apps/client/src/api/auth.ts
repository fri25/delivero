import { useMutation } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { AuthResponse } from './types';

interface LoginInput {
  telephone: string;
  motDePasse: string;
}

interface RegisterInput extends LoginInput {
  nom: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginInput) => apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: dto }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterInput) => apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: dto }),
  });
}
