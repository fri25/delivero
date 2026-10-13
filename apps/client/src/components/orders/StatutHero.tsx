import { CircleAlert, CircleCheck, CircleX, Clock3, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TonStatut = 'actif' | 'paiement' | 'succes' | 'echec';

const ICONES = {
  actif: Clock3,
  paiement: Smartphone,
  succes: CircleCheck,
  echec: CircleX,
} as const;

/**
 * Top of an order detail page: one plain sentence saying where the order is.
 * The timeline below gives the detail; this answers "où en est ma commande ?"
 * at a glance.
 */
export function StatutHero({
  ton,
  titre,
  message,
  motif,
}: {
  ton: TonStatut;
  titre: string;
  message?: string;
  /** Refusal / dispute reason given by the restaurant or the dispatcher. */
  motif?: string | null;
}) {
  const Icone = ICONES[ton];
  return (
    <section
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-2xl p-4 sm:p-5',
        ton === 'actif' && 'bg-primary text-primary-foreground',
        ton === 'paiement' && 'bg-brand-navy text-white',
        ton === 'succes' && 'bg-secondary text-foreground',
        ton === 'echec' && 'bg-muted text-foreground',
      )}
    >
      <Icone
        className={cn('mt-0.5 size-6 shrink-0', ton === 'succes' && 'text-primary', ton === 'echec' && 'text-destructive')}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-heading text-lg leading-tight font-semibold sm:text-xl">{titre}</p>
        {message && (
          <p className={cn('mt-1 text-sm', ton === 'actif' || ton === 'paiement' ? 'text-white/85' : 'text-muted-foreground')}>
            {message}
          </p>
        )}
        {motif && (
          <p className="mt-2 flex items-start gap-1.5 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Motif : {motif}</span>
          </p>
        )}
      </div>
    </section>
  );
}
