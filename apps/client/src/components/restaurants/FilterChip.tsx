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
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer',
        actif
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 border border-primary'
          : 'bg-card text-foreground/80 hover:bg-secondary hover:text-foreground border border-border/80 shadow-2xs',
      )}
    >
      {children}
    </button>
  );
}

