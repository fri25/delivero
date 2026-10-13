import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EtapeSuivi {
  label: string;
  /** Shown under the current step only: what is happening right now. */
  detail?: string;
}

/**
 * Vertical tracking timeline shared by every service. Vertical rather than a
 * horizontal stepper: 5 to 7 steps never fit across a 360 px phone.
 *
 * `indexCourant` is the step in progress; every step before it is done.
 * `termine` marks the last step as done too (delivered, completed).
 */
export function SuiviEtapes({
  etapes,
  indexCourant,
  termine = false,
}: {
  etapes: EtapeSuivi[];
  indexCourant: number;
  termine?: boolean;
}) {
  return (
    <ol className="relative">
      {etapes.map((etape, index) => {
        const faite = index < indexCourant || (termine && index <= indexCourant);
        const courante = !termine && index === indexCourant;
        const derniere = index === etapes.length - 1;
        return (
          <li key={etape.label} className="relative flex gap-3 pb-5 last:pb-0" aria-current={courante ? 'step' : undefined}>
            {!derniere && (
              <span
                aria-hidden="true"
                className={cn('absolute top-7 left-[13px] h-[calc(100%-1.5rem)] w-0.5', faite ? 'bg-primary' : 'bg-border')}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                faite && 'border-primary bg-primary text-primary-foreground',
                courante && 'border-primary bg-card text-primary ring-4 ring-primary/15',
                !faite && !courante && 'border-border bg-card text-muted-foreground',
              )}
            >
              {faite ? (
                <Check className="size-4" aria-hidden="true" />
              ) : courante ? (
                <span className="size-2.5 animate-pulse rounded-full bg-primary" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm',
                  courante ? 'font-semibold text-foreground' : faite ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {etape.label}
                <span className="sr-only">{faite ? ' (terminé)' : courante ? ' (en cours)' : ' (à venir)'}</span>
              </p>
              {courante && etape.detail && <p className="mt-0.5 text-sm text-muted-foreground">{etape.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
