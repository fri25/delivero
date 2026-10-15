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
        'relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-sm border transition-all duration-300',
        ton === 'actif' &&
          'bg-gradient-to-r from-brand-navy via-[#0c2f66] to-brand-blue text-white border-white/10 shadow-lg shadow-primary/10',
        ton === 'paiement' &&
          'bg-gradient-to-r from-brand-navy to-[#002b66] text-white border-white/10 shadow-md',
        ton === 'succes' &&
          'bg-emerald-500/10 text-emerald-950 dark:text-emerald-50 border-emerald-500/20',
        ton === 'echec' &&
          'bg-destructive/10 text-destructive border-destructive/20',
      )}
    >
      {ton === 'actif' && (
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-light/15 blur-2xl pointer-events-none" />
      )}
      <div className="relative z-10 flex items-start gap-4">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-xs',
            ton === 'actif' && 'bg-white/15 text-white backdrop-blur-md',
            ton === 'paiement' && 'bg-brand-light/20 text-brand-light backdrop-blur-md',
            ton === 'succes' && 'bg-emerald-500 text-white',
            ton === 'echec' && 'bg-destructive text-destructive-foreground',
          )}
        >
          <Icone className="size-5.5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold leading-snug sm:text-xl">{titre}</h2>
            {ton === 'actif' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> En cours
              </span>
            )}
          </div>
          {message && (
            <p
              className={cn(
                'mt-1.5 text-xs sm:text-sm leading-relaxed',
                ton === 'actif' || ton === 'paiement' ? 'text-white/85' : 'text-muted-foreground',
              )}
            >
              {message}
            </p>
          )}
          {motif && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/15 p-2.5 text-xs sm:text-sm">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Motif : {motif}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
