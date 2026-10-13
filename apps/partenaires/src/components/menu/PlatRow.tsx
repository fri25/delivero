import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRemovePlat, useTogglePlatDisponibilite, useUpdatePlat } from '@/api/restaurant';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';
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
      <li>
      <form
        className="space-y-2 rounded-2xl bg-card p-3 ring-2 ring-primary"
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
              list="categories-menu"
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
      </li>
    );
  }

  return (
    <li
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-card p-3 ring-1 ring-foreground/10',
        !plat.disponible && 'bg-muted/60',
      )}
    >
      {/* Wraps the controls under the name on a narrow phone rather than cutting the name. */}
      <div className="min-w-0 flex-[1_1_11rem]">
        <p className={cn('font-medium', !plat.disponible && 'text-muted-foreground line-through')}>
          {plat.nom}
        </p>
        {plat.description && <p className="truncate text-sm text-muted-foreground">{plat.description}</p>}
        <p className="text-sm font-semibold tabular-nums">{formatPrixFcfa(plat.prix)}</p>
      </div>

      {confirmSuppression ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-sm">Supprimer ?</span>
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
            Oui
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmSuppression(false)}>
            Non
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          {/* F-RES-05: out of stock in one tap, hidden from clients at once. */}
          <button
            type="button"
            role="switch"
            aria-checked={plat.disponible}
            aria-label={`${plat.nom} disponible`}
            disabled={toggleDisponibilite.isPending}
            onClick={() => {
              toggleDisponibilite.mutate(
                { id: plat.id, disponible: !plat.disponible },
                {
                  onSuccess: (data) =>
                    toast.success(data.disponible ? `${plat.nom} : de nouveau disponible.` : `${plat.nom} : en rupture.`),
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors disabled:opacity-60',
              plat.disponible ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            <span
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                plat.disponible ? 'bg-success' : 'bg-muted-foreground/40',
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'absolute top-0.5 size-4 rounded-full bg-white shadow transition-all',
                  plat.disponible ? 'left-4.5' : 'left-0.5',
                )}
              />
            </span>
            {plat.disponible ? 'Disponible' : 'Rupture'}
          </button>
          <Button size="icon-sm" variant="ghost" aria-label={`Modifier ${plat.nom}`} onClick={() => setModeEdition(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Supprimer ${plat.nom}`}
            onClick={() => setConfirmSuppression(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
}
