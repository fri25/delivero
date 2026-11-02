import { cn } from '@/lib/utils';

export type TonStatut = 'actif' | 'paiement' | 'succes' | 'echec';

/**
 * Top of an order detail page: one plain sentence saying where the order is.
 * The timeline below gives the detail; this answers "où en est ma commande ?"
 * at a glance. In progress = navy band with the red "live" dot, like the home
 * banner; finished states are quieter.
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
  const sombre = ton === 'actif' || ton === 'paiement';
  return (
    <section
      aria-live="polite"
      className={cn(
        'rounded-2xl px-4 py-4 sm:px-5',
        sombre && 'bg-brand-navy text-white',
        ton === 'succes' && 'carte',
        ton === 'echec' && 'carte border border-destructive',
      )}
    >
      <div className="flex items-baseline gap-2.5">
        <span
          className={cn(
            'size-2 shrink-0 -translate-y-0.5 rounded-full',
            sombre && 'bg-[#ff5a61]',
            ton === 'succes' && 'bg-primary',
            ton === 'echec' && 'bg-destructive',
          )}
          aria-hidden="true"
        />
        <h2 className={cn('text-xl leading-snug font-bold', ton === 'echec' && 'text-destructive')}>{titre}</h2>
      </div>
      {message && (
        <p className={cn('mt-1 pl-4.5 text-[15px]', sombre ? 'text-[#c4d0e8]' : 'text-muted-foreground')}>{message}</p>
      )}
      {motif && (
        <p className={cn('mt-2 pl-4.5 text-[15px]', sombre ? 'text-white' : 'text-foreground')}>
          <strong>Motif :</strong> {motif}
        </p>
      )}
    </section>
  );
}
