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
      className="gap-1.5 bg-brand-blue text-white hover:bg-brand-blue/85"
      onClick={deverrouillerSon}
    >
      <BellRing className="size-4" aria-hidden="true" />
      <span className="sm:hidden">Son</span>
      <span className="hidden sm:inline">Activer le son</span>
    </Button>
  );
}
