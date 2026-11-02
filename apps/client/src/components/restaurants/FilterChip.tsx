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
        'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
        actif
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card text-foreground hover:border-foreground/30',
      )}
    >
      {children}
    </button>
  );
}
