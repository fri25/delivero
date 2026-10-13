// Liens WhatsApp « wa.me » entre client et livreur (F-CLI-26, décision du
// 13/10 : bouton WhatsApp en complément de l'appel, pas de messagerie
// intégrée). Partagé par les apps client et livreur.

/**
 * Numéro béninois → format international sans « + » attendu par wa.me.
 * Accepte les formes rencontrées en base : « +22901… », « 22901… »,
 * « 01 57 86 69 59 » et l'ancien format à 8 chiffres (le Bénin a ajouté le
 * préfixe 01 en 2024). Renvoie null si le numéro est inexploitable.
 */
export function numeroWhatsApp(telephone: string): string | null {
  const chiffres = telephone.replace(/\D/g, '');
  if (chiffres.startsWith('229') && chiffres.length >= 11) return chiffres;
  if (chiffres.length === 10) return `229${chiffres}`;
  if (chiffres.length === 8) return `22901${chiffres}`;
  return null;
}

export function lienWhatsApp(telephone: string, message?: string): string | null {
  const numero = numeroWhatsApp(telephone);
  if (!numero) return null;
  return message ? `https://wa.me/${numero}?text=${encodeURIComponent(message)}` : `https://wa.me/${numero}`;
}
