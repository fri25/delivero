import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FilterChip({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
        actif ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
      )}
    >
      {children}
    </button>
  );
}
