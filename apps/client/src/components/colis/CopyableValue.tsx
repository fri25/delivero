import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/**
 * Ligne "libellé + valeur + bouton copier", utilisée pour le code de remise
 * et le lien public de suivi (voir docs/service-colis.md : aucune notification
 * automatique n'existe encore, le client relaie ces informations lui-même).
 */
export function CopyableValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copié.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier automatiquement.');
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 text-sm">{value}</code>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => void copy()} aria-label="Copier">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
