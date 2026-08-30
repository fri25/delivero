import { useState } from 'react';
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
      <Button size="sm" onClick={() => setOuvert(true)}>
        Nouvelle zone
      </Button>
    );
  }

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-4"
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
              toast.success('Zone créée.');
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
      <div className="space-y-1.5">
        <Label htmlFor="zone-nom">Nom</Label>
        <Input id="zone-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zone-frais">Frais de livraison (FCFA)</Label>
        <Input
          id="zone-frais"
          type="number"
          min="0"
          value={fraisLivraison}
          onChange={(e) => setFraisLivraison(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zone-colis">Tarif de base Colis (FCFA)</Label>
        <Input
          id="zone-colis"
          type="number"
          min="0"
          value={tarifBaseColis}
          onChange={(e) => setTarifBaseColis(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zone-courses">Tarif de base Courses express (FCFA)</Label>
        <Input
          id="zone-courses"
          type="number"
          min="0"
          value={tarifBaseCoursesExpress}
          onChange={(e) => setTarifBaseCoursesExpress(e.target.value)}
          required
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-4">
        <Button type="submit" size="sm" disabled={createZone.isPending}>
          Créer
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOuvert(false)}>
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
      <tr className="border-t border-border">
        <td className="px-3 py-2 font-medium">{zone.nom}</td>
        <td className="px-3 py-2">{formatPrixFcfa(zone.fraisLivraison)}</td>
        <td className="px-3 py-2">{formatPrixFcfa(zone.grilleTarifaireColis?.tarifBase ?? null)}</td>
        <td className="px-3 py-2">
          {formatPrixFcfa(zone.grilleTarifaireCoursesExpress?.tarifBase ?? null)}
        </td>
        <td className="px-3 py-2">
          <Button size="sm" variant="outline" onClick={() => setEdition(true)}>
            Modifier
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-muted/30">
      <td className="px-3 py-2 font-medium">{zone.nom}</td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          className="h-7 w-28"
          value={fraisLivraison}
          onChange={(e) => setFraisLivraison(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          className="h-7 w-28"
          value={tarifBaseColis}
          onChange={(e) => setTarifBaseColis(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          className="h-7 w-28"
          value={tarifBaseCoursesExpress}
          onChange={(e) => setTarifBaseCoursesExpress(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button
            size="sm"
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
            Enregistrer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEdition(false)}>
            Annuler
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function ZonesPage() {
  const { data: zones, isPending } = useZones();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Zones et grilles tarifaires</h1>
        <p className="text-sm text-muted-foreground">
          Frais de livraison Repas et tarifs de base Colis / Courses express, par zone (F-ADM-10).
        </p>
      </div>

      <NouvelleZoneForm />

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : !zones || zones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune zone.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Zone</th>
                <th className="px-3 py-2 font-medium">Frais livraison</th>
                <th className="px-3 py-2 font-medium">Tarif base Colis</th>
                <th className="px-3 py-2 font-medium">Tarif base Courses express</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <ZoneRow key={zone.id} zone={zone} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
