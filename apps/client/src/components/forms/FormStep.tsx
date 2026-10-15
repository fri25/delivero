import { type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Numbered card for one part of an order form. Splitting a long form into
 * "1. Qui envoie ? 2. Le colis…" tells the user where they are and what is
 * left; the number turns into a check once the part is complete.
 */
export function FormStep({
  numero,
  titre,
  aide,
  complete = false,
  children,
}: {
  numero: number;
  titre: string;
  aide?: string;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6 border border-border/70 shadow-xs">
      <header className="flex items-start gap-3.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all shadow-2xs',
            complete
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-primary/10 text-primary border border-primary/20',
          )}
          aria-hidden="true"
        >
          {complete ? <Check className="size-4 stroke-[3]" /> : numero}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-heading text-lg leading-snug font-bold text-foreground">{titre}</h2>
          {aide && <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">{aide}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
