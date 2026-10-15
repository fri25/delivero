import { useState } from 'react';
import { Plus, MapPin, Banknote, Loader2 } from 'lucide-react';
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
      className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        creer.mutate(
          { nom: nom.trim(), fraisLivraison: Number(frais) },
          {
            onSuccess: () => {
              toast.success(`Le quartier « ${nom.trim()} » a été ajouté avec succès.`);
              setNom('');
              setFrais('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plus className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-sm font-bold text-foreground">Ajouter un quartier desservi</h2>
          <p className="text-xs text-muted-foreground">
            Définit le tarif standard de livraison applicable à cette zone de la ville.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-12 items-end">
        <div className="sm:col-span-6 space-y-1.5">
          <Label htmlFor="quartier-nom" className="text-xs font-semibold">
            Nom officiel du quartier *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="quartier-nom"
              className="pl-9 rounded-xl"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Yokossi, Ourbouga, Santa..."
              required
            />
          </div>
        </div>

        <div className="sm:col-span-4 space-y-1.5">
          <Label htmlFor="quartier-frais" className="text-xs font-semibold">
            Prix de livraison (FCFA) *
          </Label>
          <div className="relative">
            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="quartier-frais"
              type="number"
              min="0"
              step="50"
              className="pl-9 rounded-xl font-mono font-bold"
              value={frais}
              onChange={(e) => setFrais(e.target.value)}
              placeholder="500 ou 1000"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <Button
            type="submit"
            className="w-full rounded-xl font-bold shadow-xs gap-1.5 h-10"
            disabled={creer.isPending}
          >
            {creer.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Ajouter
          </Button>
        </div>
      </div>
    </form>
  );
}
