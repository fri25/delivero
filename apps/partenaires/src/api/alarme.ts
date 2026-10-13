import { useEffect } from 'react';
import { jouerAlerte } from '../lib/alarme';
import { useMesCommandes } from './commandes';

const INTERVALLE_MS = 6000;
const TITRE = document.title;

/**
 * Rings every 6 s while at least one order waits for acceptance — a single
 * beep is easily missed in a noisy kitchen — and shows the count in the tab
 * title. Stops as soon as every order has been accepted or refused.
 */
export function useAlarmeCommandes(): number {
  const { data: commandes } = useMesCommandes();
  const enAttente = commandes?.filter((commande) => commande.statut === 'en_attente_acceptation').length ?? 0;

  useEffect(() => {
    document.title = enAttente > 0 ? `(${enAttente}) Nouvelle commande — ChapExpress` : TITRE;
    if (enAttente === 0) return;
    jouerAlerte();
    const minuterie = window.setInterval(jouerAlerte, INTERVALLE_MS);
    return () => window.clearInterval(minuterie);
  }, [enAttente]);

  return enAttente;
}
