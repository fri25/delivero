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
    <ol className="relative pl-1">
      {etapes.map((etape, index) => {
        const faite = index < indexCourant || (termine && index <= indexCourant);
        const courante = !termine && index === indexCourant;
        const derniere = index === etapes.length - 1;
        return (
          <li key={etape.label} className="relative flex gap-3.5 pb-6 last:pb-0" aria-current={courante ? 'step' : undefined}>
            {!derniere && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-8 left-[15px] h-[calc(100%-1.75rem)] w-0.5 transition-colors duration-300',
                  faite ? 'bg-primary' : 'bg-border/80',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                faite && 'border-primary bg-primary text-primary-foreground',
                courante && 'border-primary bg-background text-primary',
                !faite && !courante && 'border-border bg-background text-muted-foreground',
              )}
            >
              {faite ? (
                <Check className="size-4 stroke-[3]" aria-hidden="true" />
              ) : courante ? (
                <span className="size-2.5 rounded-full bg-primary" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 pt-0.5 flex-1">
              <p
                className={cn(
                  'text-sm leading-snug',
                  courante ? 'font-heading font-bold text-foreground' : faite ? 'font-semibold text-foreground/90' : 'font-medium text-muted-foreground',
                )}
              >
                {etape.label}
                <span className="sr-only">{faite ? ' (terminé)' : courante ? ' (en cours)' : ' (à venir)'}</span>
              </p>
              {courante && etape.detail && (
                <div className="mt-1.5 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-foreground/80 font-medium leading-relaxed">
                  {etape.detail}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
