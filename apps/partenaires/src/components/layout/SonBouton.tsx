import { useSyncExternalStore } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { abonnerSon, deverrouillerSon, sonActif } from '@/lib/alarme';

/**
 * Shown while the browser still blocks sound: without one tap on the page the
 * new-order alarm stays silent. Disappears once sound is allowed.
 */
export function SonBouton() {
  const actif = useSyncExternalStore(abonnerSon, sonActif);
  if (actif) return null;
  return (
    <Button
      size="sm"
      className="relative gap-1.5 rounded-full bg-brand-blue/90 hover:bg-brand-blue text-white shadow-sm ring-2 ring-cyan-400/50 animate-pulse text-xs sm:text-sm h-8.5 sm:h-9 active:scale-95"
      onClick={deverrouillerSon}
      title="Activer les alertes sonores de commande"
    >
      <BellRing className="size-4 animate-bounce" aria-hidden="true" />
      <span className="sm:hidden">Son</span>
      <span className="hidden sm:inline">Activer le son</span>
    </Button>
  );
}
