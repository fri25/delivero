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

export interface OtpDemande {
  telephone: string;
  nouveauCompte: boolean;
  expireDansSecondes: number;
}

export function useDemanderOtp() {
  return useMutation({
    mutationFn: (telephone: string) =>
      apiFetch<OtpDemande>('/auth/otp/demander', { method: 'POST', body: { telephone } }),
  });
}

export function useVerifierOtp() {
  return useMutation({
    mutationFn: (dto: { telephone: string; code: string; nom?: string }) =>
      apiFetch<AuthResponse>('/auth/otp/verifier', { method: 'POST', body: dto }),
  });
}
