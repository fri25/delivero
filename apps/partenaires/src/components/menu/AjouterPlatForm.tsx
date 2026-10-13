import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlat } from '@/api/restaurant';

/** Collapsed form: the menu itself stays the first thing on screen. */
export function AjouterPlatForm({ onTermine }: { onTermine: () => void }) {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const createPlat = useCreatePlat();

  return (
    <form
      className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
      onSubmit={(event) => {
        event.preventDefault();
        const prixNombre = Number(prix);
        if (!nom.trim() || !Number.isFinite(prixNombre) || prixNombre <= 0) {
          toast.error('Nom et prix (positif) requis.');
          return;
        }
        createPlat.mutate(
          {
            nom: nom.trim(),
            categorie: categorie.trim() || undefined,
            description: description.trim() || undefined,
            prix: prixNombre,
          },
          {
            onSuccess: () => {
              toast.success('Plat ajouté au menu.');
              setNom('');
              setCategorie('');
              setDescription('');
              setPrix('');
              onTermine();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <p className="font-heading font-semibold">Nouveau plat</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="nouveau-nom">Nom</Label>
          <Input id="nouveau-nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nouvelle-categorie">Catégorie</Label>
          <Input
            id="nouvelle-categorie"
            list="categories-menu"
            placeholder="ex. Grillades"
            value={categorie}
            onChange={(event) => setCategorie(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="nouvelle-description">Description courte</Label>
        <Textarea
          id="nouvelle-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nouveau-prix">Prix (FCFA)</Label>
        <Input
          id="nouveau-prix"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={prix}
          onChange={(event) => setPrix(event.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="h-11 flex-1" disabled={createPlat.isPending}>
          {createPlat.isPending ? 'Ajout...' : 'Ajouter au menu'}
        </Button>
        <Button type="button" variant="ghost" className="h-11" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
