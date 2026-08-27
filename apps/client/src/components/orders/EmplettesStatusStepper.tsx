import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatutEmplettes } from '@/api/types';

const STEPS: { key: StatutEmplettes; label: string }[] = [
  { key: 'confirmee', label: 'Confirmée' },
  { key: 'achats_en_cours', label: 'Achats' },
  { key: 'achats_termines', label: 'Achats terminés' },
  { key: 'en_route', label: 'En route' },
  { key: 'livree', label: 'Livrée' },
];

export function EmplettesStatusStepper({
  statut,
  motif,
}: {
  statut: StatutEmplettes;
  motif?: string | null;
}) {
  if (statut === 'litige') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <p className="font-medium">Litige en cours</p>
        {motif && <p className="text-sm">{motif}</p>}
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

  // validation_depassement est un état transitoire dans achats_en_cours (voir
  // docs/service-emplettes.md) : même position dans la barre de progression,
  // l'alerte de dépassement s'affiche séparément (voir la page de détail).
  const statutAffiche = statut === 'validation_depassement' ? 'achats_en_cours' : statut;
  const currentIndex = STEPS.findIndex((step) => step.key === statutAffiche);

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
