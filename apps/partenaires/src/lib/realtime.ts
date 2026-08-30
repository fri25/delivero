// F-RES-01 : réception temps réel + alerte sonore. Le polling reste en filet
// de secours (POLL_INTERVAL_MS dans api/commandes.ts). Voir
// apps/api/src/realtime/realtime.gateway.ts pour le serveur.
export const REALTIME_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(
  /\/api\/?$/,
  '',
);

export interface CommandeNouvellePayload {
  typeService: string;
  commandeId: string;
}

// Bip généré (oscillateur Web Audio), pas de fichier audio à charger — cohérent
// avec le budget JS serré en 3G (voir docs/exigences-non-fonctionnelles.md).
export function jouerAlerteSonore() {
  try {
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
    oscillator.onended = () => void ctx.close();
  } catch {
    // Lecture audio bloquée (autoplay policy, contexte non déverrouillé par
    // une interaction utilisateur) : dégradation silencieuse, l'alerte
    // visuelle (toast + liste rafraîchie) reste fonctionnelle.
  }
}
