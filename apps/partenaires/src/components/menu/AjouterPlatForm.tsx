import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlat } from '@/api/restaurant';
import { envoyerPhoto, miniature } from '@/lib/medias';

/** Collapsed form: the menu itself stays the first thing on screen. */
export function AjouterPlatForm({ onTermine }: { onTermine: () => void }) {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);
  const createPlat = useCreatePlat();

  const handleFichier = async (fichier: File) => {
    setEnvoiPhoto(true);
    try {
      const url = await envoyerPhoto(fichier, 'plats');
      setPhotoUrl(url);
      toast.success('Photo ajoutée.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnvoiPhoto(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-md"
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
        createPlat.mutate(
          {
            nom: nom.trim(),
            categorie: categorie.trim() || undefined,
            description: description.trim() || undefined,
            prix: prixNombre,
            photoUrl: photoUrl || undefined,
          },
          {
            onSuccess: () => {
              toast.success('Plat ajouté au menu avec succès.');
              setNom('');
              setCategorie('');
              setDescription('');
              setPrix('');
              setPhotoUrl(null);
              onTermine();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <p className="font-heading text-lg font-bold text-foreground">Nouveau plat au menu</p>
        <span className="text-xs text-muted-foreground">Formulaire d'ajout rapide</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nouveau-nom" className="text-xs font-semibold">Nom du plat *</Label>
          <Input
            id="nouveau-nom"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Ex. Poulet braisé aux épices"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nouvelle-categorie" className="text-xs font-semibold">Catégorie</Label>
          <Input
            id="nouvelle-categorie"
            list="categories-menu"
            placeholder="ex. Grillades, Plats locaux, Boissons"
            value={categorie}
            onChange={(event) => setCategorie(event.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nouvelle-description" className="text-xs font-semibold">Description courte</Label>
        <Textarea
          id="nouvelle-description"
          placeholder="Ingrédients, accompagnements (riz, alloco...)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-xl text-sm"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nouveau-prix" className="text-xs font-semibold">Prix en FCFA *</Label>
        <Input
          id="nouveau-prix"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder="Ex. 3500"
          value={prix}
          onChange={(event) => setPrix(event.target.value)}
          className="rounded-xl font-mono"
          required
        />
      </div>

      {/* Photo upload Cloudinary (F-RES-04) */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Photo du plat <span className="font-normal text-muted-foreground">(recommandé pour attirer les clients)</span></Label>
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
                className="size-20 rounded-2xl object-cover ring-1 ring-border shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoUrl(null);
                  if (inputFichier.current) inputFichier.current.value = '';
                }}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-sm hover:opacity-90 transition-opacity"
                title="Supprimer la photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Photo enregistrée. Cliquez sur la croix pour la retirer ou en choisir une autre.</p>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={envoiPhoto}
            onClick={() => inputFichier.current?.click()}
            className="flex h-10 items-center gap-2 rounded-xl text-xs font-medium"
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
          className="h-11 flex-1 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm active:scale-98 transition-all"
          disabled={createPlat.isPending || envoiPhoto}
        >
          {createPlat.isPending ? 'Ajout en cours...' : 'Ajouter au menu'}
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
