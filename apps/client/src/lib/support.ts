import { lienWhatsAppSupport } from '@delivero/config/entreprise';
import { useEntreprise } from '@/lib/entreprise';

// Support ChapExpress : 01 57 86 69 59 (format béninois à 10 chiffres, le 01
// fait partie du numéro et reste après l'indicatif +229).
export const WHATSAPP_SUPPORT = 'https://wa.me/2290157866959';

/**
 * WhatsApp support of the company the app is opened for (étape 6); the
 * CHAP EXPRESS number above until the API answers.
 */
export function useLienSupport(texte?: string): string {
  return lienWhatsAppSupport(useEntreprise(), texte) ?? WHATSAPP_SUPPORT;
}
