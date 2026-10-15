import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Pencil, Check, X, Loader2, ArrowRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateZone, useUpdateZone, useZones } from '@/api/zones';
import { formatPrixFcfa } from '@/lib/format';
import type { Zone } from '@/api/types';

function NouvelleZoneForm() {
  const createZone = useCreateZone();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [fraisLivraison, setFraisLivraison] = useState('');
  const [tarifBaseColis, setTarifBaseColis] = useState('');
  const [tarifBaseCoursesExpress, setTarifBaseCoursesExpress] = useState('');

  if (!ouvert) {
    return (
      <Button
        onClick={() => setOuvert(true)}
        className="rounded-xl font-bold shadow-xs gap-1.5"
      >
        <Plus className="size-4" />
        Nouvelle zone
      </Button>
    );
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        createZone.mutate(
          {
            nom,
            fraisLivraison: Number(fraisLivraison),
            tarifBaseColis: Number(tarifBaseColis),
            tarifBaseCoursesExpress: Number(tarifBaseCoursesExpress),
          },
          {
            onSuccess: () => {
              toast.success(`La zone « ${nom} » a été créée.`);
              setOuvert(false);
              setNom('');
              setFraisLivraison('');
              setTarifBaseColis('');
              setTarifBaseCoursesExpress('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </span>
          <h2 className="font-heading text-sm font-bold text-foreground">Ajouter une nouvelle zone</h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => setOuvert(false)}
        >
          Fermer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="zone-nom" className="text-xs font-semibold">
            Nom de la zone *
          </Label>
          <Input
            id="zone-nom"
            className="rounded-xl"
            placeholder="Ex. Natitingou Centre"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-frais" className="text-xs font-semibold">
            Frais livraison (FCFA) *
          </Label>
          <Input
            id="zone-frais"
            type="number"
            min="0"
            className="rounded-xl font-mono font-bold"
            placeholder="Ex. 500"
            value={fraisLivraison}
            onChange={(e) => setFraisLivraison(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-colis" className="text-xs font-semibold">
            Tarif de base Colis (FCFA) *
          </Label>
          <Input
            id="zone-colis"
            type="number"
            min="0"
            className="rounded-xl font-mono font-bold"
            placeholder="Ex. 600"
            value={tarifBaseColis}
            onChange={(e) => setTarifBaseColis(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-courses" className="text-xs font-semibold">
            Tarif Courses express (FCFA) *
          </Label>
          <Input
            id="zone-courses"
            type="number"
            min="0"
            className="rounded-xl font-mono font-bold"
            placeholder="Ex. 700"
            value={tarifBaseCoursesExpress}
            onChange={(e) => setTarifBaseCoursesExpress(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          className="rounded-xl font-bold shadow-xs gap-1.5"
          disabled={createZone.isPending}
        >
          {createZone.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Créer la zone
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => setOuvert(false)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

function ZoneRow({ zone }: { zone: Zone }) {
  const updateZone = useUpdateZone();
  const [edition, setEdition] = useState(false);
  const [fraisLivraison, setFraisLivraison] = useState(zone.fraisLivraison);
  const [tarifBaseColis, setTarifBaseColis] = useState(zone.grilleTarifaireColis?.tarifBase ?? '');
  const [tarifBaseCoursesExpress, setTarifBaseCoursesExpress] = useState(
    zone.grilleTarifaireCoursesExpress?.tarifBase ?? '',
  );

  if (!edition) {
    return (
      <tr className="border-t border-border hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3.5 font-semibold text-foreground">{zone.nom}</td>
        <td className="px-4 py-3.5 font-mono font-bold text-foreground">
          {formatPrixFcfa(zone.fraisLivraison)}
        </td>
        <td className="px-4 py-3.5 font-mono text-muted-foreground">
          {formatPrixFcfa(zone.grilleTarifaireColis?.tarifBase ?? null)}
        </td>
        <td className="px-4 py-3.5 font-mono text-muted-foreground">
          {formatPrixFcfa(zone.grilleTarifaireCoursesExpress?.tarifBase ?? null)}
        </td>
        <td className="px-4 py-3.5 text-right">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg font-medium text-xs gap-1 hover:border-primary/50"
            onClick={() => setEdition(true)}
          >
            <Pencil className="size-3 text-muted-foreground" />
            Modifier
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-primary/5 transition-colors">
      <td className="px-4 py-3 font-semibold text-foreground">{zone.nom}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            className="h-8.5 w-24 rounded-lg font-mono font-bold text-sm"
            value={fraisLivraison}
            onChange={(e) => setFraisLivraison(e.target.value)}
            aria-label="Frais livraison"
          />
          <span className="text-xs text-muted-foreground">FCFA</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            className="h-8.5 w-24 rounded-lg font-mono font-bold text-sm"
            value={tarifBaseColis}
            onChange={(e) => setTarifBaseColis(e.target.value)}
            aria-label="Tarif base colis"
          />
          <span className="text-xs text-muted-foreground">FCFA</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            className="h-8.5 w-24 rounded-lg font-mono font-bold text-sm"
            value={tarifBaseCoursesExpress}
            onChange={(e) => setTarifBaseCoursesExpress(e.target.value)}
            aria-label="Tarif courses express"
          />
          <span className="text-xs text-muted-foreground">FCFA</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            className="h-8 rounded-lg font-bold gap-1 shadow-xs"
            disabled={updateZone.isPending}
            onClick={() => {
              updateZone.mutate(
                {
                  id: zone.id,
                  dto: {
                    fraisLivraison: Number(fraisLivraison),
                    tarifBaseColis: Number(tarifBaseColis),
                    tarifBaseCoursesExpress: Number(tarifBaseCoursesExpress),
                  },
                },
                {
                  onSuccess: () => {
                    toast.success('Zone mise à jour.');
                    setEdition(false);
                  },
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            {updateZone.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Enregistrer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg"
            onClick={() => {
              setFraisLivraison(zone.fraisLivraison);
              setTarifBaseColis(zone.grilleTarifaireColis?.tarifBase ?? '');
              setTarifBaseCoursesExpress(zone.grilleTarifaireCoursesExpress?.tarifBase ?? '');
              setEdition(false);
            }}
          >
            <X className="size-3.5" />
            <span className="sr-only">Annuler</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function ZonesPage() {
  const { data: zones, isPending } = useZones();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" />
            </span>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Zones et grilles tarifaires
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Frais de livraison et tarifs de base par zone opérationnelle (F-ADM-10).
          </p>
        </div>
      </div>

      {/* Info Callout regarding Neighbourhood shift */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs flex items-start gap-3">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-bold text-foreground">
            Évolution de la tarification urbaine (décision du 13/10) :
          </p>
          <p className="text-muted-foreground">
            Les prix Repas, Colis et Courses express sont désormais indexés directement au quartier de destination.
            Rendez-vous sur la page dédiée pour ajuster ces montants.
          </p>
          <div className="pt-1.5">
            <Link
              to="/quartiers"
              className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline text-xs"
            >
              <span>Accéder à la grille par Quartiers</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <NouvelleZoneForm />

      {isPending ? (
        <div className="space-y-2 rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !zones || zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Layers className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Aucune zone configurée</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Créez une première zone opérationnelle ci-dessus.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="px-4 py-3.5">Zone</th>
                  <th className="px-4 py-3.5">Frais livraison (Repas)</th>
                  <th className="px-4 py-3.5">Tarif base Colis</th>
                  <th className="px-4 py-3.5">Tarif base Courses</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {zones.map((zone) => (
                  <ZoneRow key={zone.id} zone={zone} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
