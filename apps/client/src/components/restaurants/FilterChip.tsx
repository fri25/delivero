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
        'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition-colors duration-200 active:scale-95',
        actif
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

