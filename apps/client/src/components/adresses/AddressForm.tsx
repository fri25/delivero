import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAdresse } from '@/api/adresses';
import type { Adresse } from '@/api/types';

export function AddressForm({ onCreated }: { onCreated: (adresse: Adresse) => void }) {
  const [libelle, setLibelle] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const createAdresse = useCreateAdresse();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        createAdresse.mutate(
          { libelle, pointDeRepere, estParDefaut: true },
          {
            onSuccess: (adresse) => {
              onCreated(adresse);
              setLibelle('');
              setPointDeRepere('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="libelle">Nom de l'adresse</Label>
        <Input
          id="libelle"
          placeholder="Maison, Bureau..."
          value={libelle}
          onChange={(event) => setLibelle(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pointDeRepere">Point de repère</Label>
        <Input
          id="pointDeRepere"
          placeholder="Près du grand marché, portail bleu..."
          value={pointDeRepere}
          onChange={(event) => setPointDeRepere(event.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={createAdresse.isPending} className="w-full">
        {createAdresse.isPending ? 'Ajout...' : "Ajouter l'adresse"}
      </Button>
    </form>
  );
}
