// "Mes courses" ne renvoie que les courses en cours (quel que soit leur âge)
// et les courses terminées récemment : l'écran est interrogé toutes les 8 s,
// il ne doit pas charger tout l'historique du livreur à chaque appel.
export const HISTORIQUE_LIVREUR_JOURS = 7;

// Garde-fou en plus du filtre de date : borne la taille d'une réponse.
export const HISTORIQUE_LIVREUR_MAX = 100;

export function depuisHistoriqueLivreur(): Date {
  return new Date(Date.now() - HISTORIQUE_LIVREUR_JOURS * 24 * 60 * 60 * 1000);
}

// Le Bénin est en UTC+1 toute l'année (pas d'heure d'été). Le début de
// "aujourd'hui" (clôture de caisse, récap journalier) est donc minuit à
// Natitingou, pas minuit UTC. [DÉDUIT] : aucun fuseau n'est configuré au
// niveau du projet.
const DECALAGE_BENIN_MS = 60 * 60 * 1000;

export function debutJourneeBenin(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + DECALAGE_BENIN_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - DECALAGE_BENIN_MS);
}
