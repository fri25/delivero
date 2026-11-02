import { useSyncExternalStore } from 'react';
import { BellRing } from 'lucide-react';
import { abonnerSon, deverrouillerSon, sonActif } from '@/lib/alarme';

/**
 * Shown while the browser still blocks sound: without one tap on the page the
 * new-order alarm stays silent. Red (the brand's alert signal) until sound is
 * allowed, then it disappears.
 */
export function SonBouton() {
  const actif = useSyncExternalStore(abonnerSon, sonActif);
  if (actif) return null;
  return (
    <button
      type="button"
      className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-brand-red px-3.5 text-sm font-bold text-white"
      onClick={deverrouillerSon}
      title="Activer les alertes sonores de commande"
    >
      <BellRing className="size-4" aria-hidden="true" />
      <span className="sm:hidden">Son</span>
      <span className="hidden sm:inline">Activer le son</span>
    </button>
  );
}
