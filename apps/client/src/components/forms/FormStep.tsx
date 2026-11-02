import { type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Numbered part of an order form. Splitting a long form into
 * "1. Qui envoie ? 2. Le colis…" tells the user where they are and what is
 * left; the number turns into a check once the part is complete. Parts are
 * separated by a thick rule, not boxed.
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
    <section className="carte space-y-4 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
            complete ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary',
          )}
          aria-hidden="true"
        >
          {complete ? <Check className="size-4" strokeWidth={3} /> : numero}
        </span>
        <div className="min-w-0">
          <h2 className="pt-0.5 text-lg leading-tight font-bold">{titre}</h2>
          {aide && <p className="mt-1 text-sm text-muted-foreground">{aide}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
