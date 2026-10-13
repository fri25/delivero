import { CheckCircle2, Circle } from 'lucide-react';
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
      <aside className="hidden space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:block">
        <h2 className="font-heading text-lg font-semibold">{titre}</h2>

        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <span className="text-sm text-muted-foreground">{tarifLabel}</span>
          <span className="font-heading text-xl font-semibold">
            {tarif !== undefined ? formatPrixFcfa(tarif) : '—'}
          </span>
        </div>

        {pret ? (
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Tout est prêt, vous pouvez confirmer.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Il reste à renseigner :</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {manquant.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Circle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="first-letter:uppercase">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button size="lg" className="w-full" disabled={!pret || enCours} onClick={onConfirmer}>
          {enCours ? 'Envoi en cours...' : libelle}
        </Button>
      </aside>

      {/* Mobile / tablet: spacer keeps the end of the form scrollable above the fixed bar. */}
      <div className="h-36 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground" aria-live="polite">
              {pret
                ? 'Tout est prêt.'
                : `Il manque : ${manquant[0]}${manquant.length > 1 ? `, et ${manquant.length - 1} autre${manquant.length > 2 ? 's' : ''}` : ''}`}
            </span>
            {tarif !== undefined && (
              <span className="shrink-0 font-semibold">
                <span className="sr-only">{tarifLabel} : </span>
                {formatPrixFcfa(tarif)}
              </span>
            )}
          </div>
          <Button size="lg" className="w-full" disabled={!pret || enCours} onClick={onConfirmer}>
            {enCours ? 'Envoi en cours...' : libelle}
          </Button>
        </div>
      </div>
    </div>
  );
}
