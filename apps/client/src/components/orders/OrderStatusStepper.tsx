import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatutRepas } from '@/api/types';

// Le suivi livreur (recuperee_par_livreur / en_route / livree) n'est pas encore
// pilotable depuis l'API — voir docs/service-repas.md et le module Livreur à venir.
// Le stepper s'arrête donc à « Prête ».
const STEPS: { key: StatutRepas; label: string }[] = [
  { key: 'en_attente_acceptation', label: 'En attente' },
  { key: 'confirmee', label: 'Confirmée' },
  { key: 'en_preparation', label: 'En préparation' },
  { key: 'prete', label: 'Prête' },
];

export function OrderStatusStepper({ statut, motifRefus }: { statut: StatutRepas; motifRefus: string | null }) {
  if (statut === 'refusee') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <p className="font-medium">Commande refusée</p>
        {motifRefus && <p className="text-sm">{motifRefus}</p>}
      </div>
    );
  }

  if (statut === 'annulee') {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-muted-foreground">
        <p className="font-medium">Commande annulée</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === statut);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const isLast = index === STEPS.length - 1;
        return (
          <li key={step.key} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-xs',
                  done
                    ? 'border-brand-green bg-brand-green text-white'
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </div>
              <span className={cn('text-xs', done ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn('mx-2 h-px flex-1', done ? 'bg-brand-green' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
