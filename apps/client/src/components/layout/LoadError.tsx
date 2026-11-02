import { Button } from '@/components/ui/button';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border-[1.5px] border-destructive p-4">
      <p className="text-sm text-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Réessayer</Button>
    </div>
  );
}
