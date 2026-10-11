import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdresses } from '@/api/adresses';
import { AddressForm } from './AddressForm';

export function AddressPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (adresseId: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: adresses, isPending } = useAdresses();

  // Preselect the default address so most orders need no tap here — also
  // when a pre-filled value (reorder) points to an address deleted since.
  const adresseParDefaut = adresses?.find((adresse) => adresse.estParDefaut) ?? adresses?.at(0);
  const valeurConnue = Boolean(value && adresses?.some((adresse) => adresse.id === value));
  useEffect(() => {
    if (adresses && !valeurConnue && adresseParDefaut) onChange(adresseParDefaut.id);
  }, [adresses, valeurConnue, adresseParDefaut, onChange]);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Chargement des adresses...</p>;
  }

  return (
    <div className="space-y-2">
      {adresses?.map((adresse) => (
        <button
          key={adresse.id}
          type="button"
          onClick={() => onChange(adresse.id)}
          className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
            value === adresse.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border hover:border-brand-blue/50'
          }`}
        >
          <p className="font-medium">{adresse.libelle}</p>
          <p className="text-muted-foreground">{adresse.pointDeRepere}</p>
        </button>
      ))}

      {adresses?.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune adresse enregistrée pour l'instant.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Nouvelle adresse
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle adresse</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSaved={(adresse) => {
              onChange(adresse.id);
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
