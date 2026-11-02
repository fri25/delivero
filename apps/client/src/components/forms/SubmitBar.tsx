import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';

/**
 * Confirm area of an order form: price, what is still missing, and the
 * confirm button. A greyed-out button alone never says why it is greyed out.
 *
 * - Below lg: fixed bottom bar naming the first missing item.
 * - From lg: sticky side panel listing every missing item. Meant to be the
 *   second column of FormLayout.
 */
export function SubmitBar({
  titre,
  tarif,
  tarifLabel = 'Tarif indicatif',
  manquant,
  enCours,
  libelle,
  onConfirmer,
}: {
  titre: string;
  tarif?: number | string;
  tarifLabel?: string;
  /** Human-readable missing items, in form order; empty when ready. */
  manquant: string[];
  enCours: boolean;
  libelle: string;
  onConfirmer: () => void;
}) {
  const pret = manquant.length === 0;

  return (
    <div className="lg:sticky lg:top-24">
      {/* Desktop side panel. */}
      <aside className="carte hidden space-y-4 p-5 lg:block">
        <h2 className="text-[17px] font-bold">{titre}</h2>

        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <span className="text-sm text-muted-foreground">{tarifLabel}</span>
          <span className="text-2xl font-bold tabular-nums">{tarif !== undefined ? formatPrixFcfa(tarif) : '—'}</span>
        </div>

        {pret ? (
          <p className="text-sm font-semibold text-primary">Tout est prêt, vous pouvez confirmer.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-bold">Il reste à renseigner :</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {manquant.map((item) => (
                <li key={item} className="flex items-baseline gap-2">
                  <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-brand-red" aria-hidden="true" />
                  <span className="first-letter:uppercase">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button className="h-11 w-full text-[15px] font-bold" disabled={!pret || enCours} onClick={onConfirmer}>
          {enCours ? 'Envoi en cours…' : libelle}
        </Button>
      </aside>

      {/* Mobile / tablet: spacer keeps the end of the form scrollable above the fixed bar. */}
      <div className="h-32 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-2xl space-y-2 px-4 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
              {pret
                ? 'Tout est prêt.'
                : `Il manque : ${manquant[0]}${manquant.length > 1 ? `, et ${manquant.length - 1} autre${manquant.length > 2 ? 's' : ''}` : ''}`}
            </span>
            {tarif !== undefined && (
              <span className="shrink-0 text-base font-bold tabular-nums">
                <span className="sr-only">{tarifLabel} : </span>
                {formatPrixFcfa(tarif)}
              </span>
            )}
          </div>
          <Button className="h-12 w-full text-[15px] font-bold" disabled={!pret || enCours} onClick={onConfirmer}>
            {enCours ? 'Envoi en cours…' : libelle}
          </Button>
        </div>
      </div>
    </div>
  );
}
