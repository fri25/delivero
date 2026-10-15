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
    <section className={cn('rounded-3xl bg-card p-5 sm:p-6 border border-border/70 shadow-xs', className)}>
      {(titre || action) && (
        <header className="mb-3.5 flex items-center justify-between gap-3 border-b border-border/50 pb-2.5">
          {titre && <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">{titre}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
