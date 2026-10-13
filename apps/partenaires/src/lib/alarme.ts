// New-order alarm (F-RES-01). Browsers block sound until the user has touched
// the page: a tablet left on the kitchen counter would stay silent. The
// AudioContext is created and resumed on the first tap anywhere, and the
// header shows "Activer le son" while it is still blocked.
// Generated beep (Web Audio oscillator): no audio file to download on 3G.

let contexte: AudioContext | null = null;
const abonnes = new Set<() => void>();

function notifier() {
  for (const abonne of abonnes) abonne();
}

function creerContexte(): AudioContext | null {
  if (contexte) return contexte;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  contexte = new Ctor();
  contexte.onstatechange = notifier;
  return contexte;
}

/** Must run inside a user gesture (tap, click, key). */
export function deverrouillerSon(): void {
  const ctx = creerContexte();
  if (ctx && ctx.state !== 'running') void ctx.resume().then(notifier);
}

export function sonActif(): boolean {
  return contexte?.state === 'running';
}

export function abonnerSon(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Two short high beeps, loud enough for a kitchen. */
export function jouerAlerte(): void {
  const ctx = creerContexte();
  if (!ctx || ctx.state !== 'running') return;
  for (const debut of [0, 0.35]) {
    const oscillateur = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillateur.type = 'square';
    oscillateur.frequency.value = 880;
    volume.gain.setValueAtTime(0.25, ctx.currentTime + debut);
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + debut + 0.3);
    oscillateur.connect(volume).connect(ctx.destination);
    oscillateur.start(ctx.currentTime + debut);
    oscillateur.stop(ctx.currentTime + debut + 0.3);
  }
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {
    // Not supported: the beep is enough.
  }
}

// Any first tap unlocks the sound, not only the dedicated button.
if (typeof window !== 'undefined') {
  const surPremierGeste = () => {
    deverrouillerSon();
    if (sonActif()) {
      window.removeEventListener('pointerdown', surPremierGeste);
      window.removeEventListener('keydown', surPremierGeste);
    }
  };
  window.addEventListener('pointerdown', surPremierGeste);
  window.addEventListener('keydown', surPremierGeste);
}
