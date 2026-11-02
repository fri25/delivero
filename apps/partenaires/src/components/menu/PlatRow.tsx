import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, Pencil, Trash2, Utensils, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRemovePlat, useTogglePlatDisponibilite, useUpdatePlat } from '@/api/restaurant';
import { formatPrixFcfa } from '@/lib/format';
import { envoyerPhoto, miniature } from '@/lib/medias';
import { cn } from '@/lib/utils';
import type { Plat } from '@/api/types';

export function PlatRow({ plat }: { plat: Plat }) {
  const [modeEdition, setModeEdition] = useState(false);
  const [confirmSuppression, setConfirmSuppression] = useState(false);
  const [nom, setNom] = useState(plat.nom);
  const [categorie, setCategorie] = useState(plat.categorie ?? '');
  const [description, setDescription] = useState(plat.description ?? '');
  const [prix, setPrix] = useState(String(plat.prix));
  const [photoUrl, setPhotoUrl] = useState<string | null>(plat.photoUrl);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);

  const toggleDisponibilite = useTogglePlatDisponibilite();
  const updatePlat = useUpdatePlat();
  const removePlat = useRemovePlat();

  const handleFichier = async (fichier: File) => {
    setEnvoiPhoto(true);
    try {
      const url = await envoyerPhoto(fichier, 'plats');
      setPhotoUrl(url);
      toast.success('Photo mise à jour.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const ouvrirEdition = () => {
    setNom(plat.nom);
    setCategorie(plat.categorie ?? '');
    setDescription(plat.description ?? '');
    setPrix(String(plat.prix));
    setPhotoUrl(plat.photoUrl);
    setModeEdition(true);
  };

  if (modeEdition) {
    return (
      <li className="list-none">
        <form
          className="carte space-y-4 p-4 ring-2 ring-primary sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const prixNombre = Number(prix);
            if (!nom.trim() || !Number.isFinite(prixNombre) || prixNombre <= 0) {
              toast.error('Nom et prix (positif) requis.');
              return;
            }
            if (envoiPhoto) {
              toast.error('Veuillez patienter pendant l’envoi de la photo.');
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
                  photoUrl: photoUrl ?? null,
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
          <p className="text-sm font-bold text-primary">Modifier le plat</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`nom-${plat.id}`} className="text-xs font-semibold">Nom du plat</Label>
              <Input
                id={`nom-${plat.id}`}
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`categorie-${plat.id}`} className="text-xs font-semibold">Catégorie</Label>
              <Input
                id={`categorie-${plat.id}`}
                list="categories-menu"
                value={categorie}
                onChange={(event) => setCategorie(event.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`description-${plat.id}`} className="text-xs font-semibold">Description courte</Label>
            <Textarea
              id={`description-${plat.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-xl text-sm"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`prix-${plat.id}`} className="text-xs font-semibold">Prix de vente (FCFA)</Label>
            <Input
              id={`prix-${plat.id}`}
              type="number"
              min="1"
              step="1"
              value={prix}
              onChange={(event) => setPrix(event.target.value)}
              required
              className="rounded-xl tabular-nums"
            />
          </div>

          {/* Photo du plat (F-RES-04) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Photo du plat</Label>
            <input
              ref={inputFichier}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFichier(f);
              }}
            />
            {photoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative inline-block">
                  <img
                    src={miniature(photoUrl, 200)}
                    alt="Aperçu du plat"
                    className="size-16 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      if (inputFichier.current) inputFichier.current.value = '';
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background hover:opacity-90"
                    title="Supprimer la photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={envoiPhoto}
                  onClick={() => inputFichier.current?.click()}
                  className="h-8.5 rounded-xl text-xs"
                >
                  Changer la photo
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={envoiPhoto}
                onClick={() => inputFichier.current?.click()}
                className="flex h-9 items-center gap-2 rounded-xl text-xs"
              >
                {envoiPhoto ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Optimisation et envoi...
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    Ajouter une photo
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/60">
            <Button
              type="submit"
              className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90"
              disabled={updatePlat.isPending || envoiPhoto}
            >
              {updatePlat.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setPhotoUrl(plat.photoUrl);
                setModeEdition(false);
              }}
            >
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
        'carte flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-3.5',
        !plat.disponible && 'bg-muted/40 opacity-80',
      )}
    >
      <div className="flex min-w-0 flex-[1_1_12rem] items-center gap-3">
        {plat.photoUrl ? (
          <img
            src={miniature(plat.photoUrl, 160)}
            alt={plat.nom}
            className="size-16 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Utensils className="size-6 opacity-40" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold leading-snug text-foreground', !plat.disponible && 'text-muted-foreground line-through')}>
            {plat.nom}
          </p>
          {plat.description && <p className="truncate text-xs text-muted-foreground mt-0.5">{plat.description}</p>}
          <p className="mt-1 tabular-nums text-sm font-bold text-foreground ">{formatPrixFcfa(plat.prix)}</p>
        </div>
      </div>

      {confirmSuppression ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-destructive/40 p-1.5">
          <span className="text-xs font-semibold text-destructive px-1">Supprimer ?</span>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 rounded-xl px-2.5 text-xs font-bold"
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
          <Button size="sm" variant="ghost" className="h-8 rounded-xl px-2 text-xs" onClick={() => setConfirmSuppression(false)}>
            Non
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
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
              'flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold disabled:opacity-60',
              plat.disponible
                ? 'bg-accent text-primary'
                : 'bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500/25',
            )}
          >
            <span
              className={cn(
                'relative h-4.5 w-8 rounded-full transition-colors',
                plat.disponible ? 'bg-primary' : 'bg-muted-foreground/40',
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'absolute top-0.5 size-3.5 rounded-full bg-white transition-all',
                  plat.disponible ? 'left-4' : 'left-0.5',
                )}
              />
            </span>
            {plat.disponible ? 'Disponible' : 'Rupture'}
          </button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="size-8.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Modifier ${plat.nom}`}
            onClick={ouvrirEdition}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="size-8.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Supprimer ${plat.nom}`}
            onClick={() => setConfirmSuppression(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}
