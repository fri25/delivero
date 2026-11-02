import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Titled block of an order detail page, opened by a thick rule. */
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
    <section className={cn('carte p-4 sm:p-5', className)}>
      {(titre || action) && (
        <header className="mb-3 flex items-baseline justify-between gap-3">
          {titre && <h2 className="text-[17px] font-bold">{titre}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
