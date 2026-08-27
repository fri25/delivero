import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRemovePlat, useTogglePlatDisponibilite, useUpdatePlat } from '@/api/restaurant';
import { formatPrixFcfa } from '@/lib/format';
import type { Plat } from '@/api/types';

export function PlatRow({ plat }: { plat: Plat }) {
  const [modeEdition, setModeEdition] = useState(false);
  const [confirmSuppression, setConfirmSuppression] = useState(false);
  const [nom, setNom] = useState(plat.nom);
  const [categorie, setCategorie] = useState(plat.categorie ?? '');
  const [description, setDescription] = useState(plat.description ?? '');
  const [prix, setPrix] = useState(String(plat.prix));

  const toggleDisponibilite = useTogglePlatDisponibilite();
  const updatePlat = useUpdatePlat();
  const removePlat = useRemovePlat();

  if (modeEdition) {
    return (
      <form
        className="space-y-2 rounded-lg border border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const prixNombre = Number(prix);
          if (!nom.trim() || !Number.isFinite(prixNombre) || prixNombre <= 0) {
            toast.error('Nom et prix (positif) requis.');
            return;
          }
          updatePlat.mutate(
            {
              id: plat.id,
              dto: {
                nom: nom.trim(),
                categorie: categorie.trim() || undefined,
                description: description.trim() || undefined,
                prix: prixNombre,
              },
            },
            {
              onSuccess: () => {
                toast.success('Plat mis à jour.');
                setModeEdition(false);
              },
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`nom-${plat.id}`}>Nom</Label>
            <Input id={`nom-${plat.id}`} value={nom} onChange={(event) => setNom(event.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`categorie-${plat.id}`}>Catégorie</Label>
            <Input
              id={`categorie-${plat.id}`}
              value={categorie}
              onChange={(event) => setCategorie(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`description-${plat.id}`}>Description courte</Label>
          <Textarea
            id={`description-${plat.id}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`prix-${plat.id}`}>Prix (FCFA)</Label>
          <Input
            id={`prix-${plat.id}`}
            type="number"
            min="1"
            step="1"
            value={prix}
            onChange={(event) => setPrix(event.target.value)}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={updatePlat.isPending}>
            Enregistrer
          </Button>
          <Button type="button" variant="ghost" onClick={() => setModeEdition(false)}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{plat.nom}</p>
          {plat.categorie && (
            <Badge variant="outline" className="shrink-0">
              {plat.categorie}
            </Badge>
          )}
        </div>
        {plat.description && <p className="truncate text-sm text-muted-foreground">{plat.description}</p>}
        <p className="text-sm">{formatPrixFcfa(plat.prix)}</p>
      </div>

      {confirmSuppression ? (
        <div className="flex shrink-0 gap-1.5">
          <Button
            size="sm"
            variant="destructive"
            disabled={removePlat.isPending}
            onClick={() => {
              removePlat.mutate(plat.id, {
                onSuccess: () => toast.success('Plat supprimé.'),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Confirmer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmSuppression(false)}>
            Annuler
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant={plat.disponible ? 'default' : 'outline'}
            className={plat.disponible ? 'bg-brand-green hover:bg-brand-green/85' : ''}
            disabled={toggleDisponibilite.isPending}
            onClick={() => {
              toggleDisponibilite.mutate(
                { id: plat.id, disponible: !plat.disponible },
                { onError: (error) => toast.error(error.message) },
              );
            }}
          >
            {plat.disponible ? 'Disponible' : 'Indisponible'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setModeEdition(true)}>
            Modifier
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmSuppression(true)}>
            Supprimer
          </Button>
        </div>
      )}
    </div>
  );
}
