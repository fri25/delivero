import { Button } from '@/components/ui/button';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
      <p className="text-sm text-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Réessayer</Button>
    </div>
  );
}
