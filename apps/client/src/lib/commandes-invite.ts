// Guest orders (F-CLI-02) remembered on this phone, so a guest who closes the
// app finds them again from the home page. A convenience only: the link sent
// by WhatsApp/SMS remains the reference (private mode, cleared storage).

const CLE = 'chapexpress-commandes-invite';
const MAX = 10;

export interface CommandeInviteMemorisee {
  jeton: string;
  typeService: 'repas' | 'colis' | 'courses_express';
  creeeLe: string;
}

export function commandesInviteMemorisees(): CommandeInviteMemorisee[] {
  try {
    const brut = localStorage.getItem(CLE);
    const liste: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? (liste as CommandeInviteMemorisee[]) : [];
  } catch {
    return [];
  }
}

export function memoriserCommandeInvite(jeton: string, typeService: CommandeInviteMemorisee['typeService']) {
  try {
    const liste = [
      { jeton, typeService, creeeLe: new Date().toISOString() },
      ...commandesInviteMemorisees().filter((c) => c.jeton !== jeton),
    ].slice(0, MAX);
    localStorage.setItem(CLE, JSON.stringify(liste));
  } catch {
    // Storage unavailable: the WhatsApp/SMS link still works.
  }
}

export function oublierCommandeInvite(jeton: string) {
  try {
    localStorage.setItem(CLE, JSON.stringify(commandesInviteMemorisees().filter((c) => c.jeton !== jeton)));
  } catch {
    // Nothing to do.
  }
}
