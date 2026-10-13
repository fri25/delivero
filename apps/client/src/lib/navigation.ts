// Top-level destinations only: form, detail and checkout pages hide the tab
// bar so their own bottom action (SubmitBar) stays reachable with one thumb.
const PAGES_AVEC_BARRE = ['/', '/repas', '/commandes', '/compte', '/aide', '/adresses'];

export function estPageAvecBarre(pathname: string): boolean {
  return PAGES_AVEC_BARRE.includes(pathname);
}

/** Pages reached from the tab bar or the home screen: no back arrow needed. */
export function estPageRacine(pathname: string): boolean {
  return pathname === '/' || pathname === '/commandes' || pathname === '/compte';
}
