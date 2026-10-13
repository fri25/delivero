import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreerQuartier } from '@/api/quartiers';

export function NouveauQuartierForm() {
  const creer = useCreerQuartier();
  const [nom, setNom] = useState('');
  const [frais, setFrais] = useState('');

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl p-4 ring-1 ring-foreground/10"
      onSubmit={(event) => {
        event.preventDefault();
        creer.mutate(
          { nom: nom.trim(), fraisLivraison: Number(frais) },
          {
            onSuccess: () => {
              toast.success(`${nom.trim()} ajouté.`);
              setNom('');
              setFrais('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label htmlFor="quartier-nom">Nouveau quartier</Label>
        <Input id="quartier-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Yokossi" required />
      </div>
      <div className="w-36 space-y-1.5">
        <Label htmlFor="quartier-frais">Prix livraison (FCFA)</Label>
        <Input
          id="quartier-frais"
          type="number"
          min="0"
          step="50"
          value={frais}
          onChange={(e) => setFrais(e.target.value)}
          placeholder="500 ou 1000"
          required
        />
      </div>
      <Button type="submit" size="sm" disabled={creer.isPending}>
        Ajouter
      </Button>
    </form>
  );
}
