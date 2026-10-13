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
    <section className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <header className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
            complete ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
          )}
          aria-hidden="true"
        >
          {complete ? <Check className="size-4" /> : numero}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-heading text-lg leading-tight font-semibold">{titre}</h2>
          {aide && <p className="mt-0.5 text-sm text-muted-foreground">{aide}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
