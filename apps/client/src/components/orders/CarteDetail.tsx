import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Titled white card used to group each block of an order detail page. */
export function CarteDetail({
  titre,
  action,
  className,
  children,
}: {
  titre?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5', className)}>
      {(titre || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {titre && <h2 className="font-heading text-base font-semibold">{titre}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
