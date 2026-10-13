import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AjouterPlatForm } from '@/components/menu/AjouterPlatForm';
import { PlatRow } from '@/components/menu/PlatRow';
import { useMesPlats } from '@/api/restaurant';
import type { Plat } from '@/api/types';

const SANS_CATEGORIE = 'Autres plats';

/** Dishes grouped by category, in the order the categories first appear. */
function parCategorie(plats: Plat[]): [string, Plat[]][] {
  const groupes = new Map<string, Plat[]>();
  for (const plat of plats) {
    const categorie = plat.categorie?.trim() || SANS_CATEGORIE;
    groupes.set(categorie, [...(groupes.get(categorie) ?? []), plat]);
  }
  return [...groupes.entries()].sort(([a], [b]) => Number(a === SANS_CATEGORIE) - Number(b === SANS_CATEGORIE));
}

export function MenuPage() {
  const { data: plats, isPending } = useMesPlats();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const groupes = plats ? parCategorie(plats) : [];
  const enRupture = plats?.filter((plat) => !plat.disponible).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Menu</h1>
          {plats && plats.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {plats.length} plat{plats.length > 1 ? 's' : ''}
              {enRupture > 0 && ` · ${enRupture} en rupture, invisible${enRupture > 1 ? 's' : ''} pour les clients`}
            </p>
          )}
        </div>
        {!ajoutOuvert && (
          <Button className="h-10 shrink-0 gap-1.5" onClick={() => setAjoutOuvert(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un plat
          </Button>
        )}
      </div>

      {/* Category suggestions for the add and edit forms. */}
      <datalist id="categories-menu">
        {groupes
          .map(([categorie]) => categorie)
          .filter((categorie) => categorie !== SANS_CATEGORIE)
          .map((categorie) => (
            <option key={categorie} value={categorie} />
          ))}
      </datalist>

      {ajoutOuvert && <AjouterPlatForm onTermine={() => setAjoutOuvert(false)} />}

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : groupes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">Votre menu est vide</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez vos plats pour que les clients puissent commander.</p>
        </div>
      ) : (
        groupes.map(([categorie, platsDuGroupe]) => (
          <section key={categorie} className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {categorie} <span className="font-normal">({platsDuGroupe.length})</span>
            </h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {platsDuGroupe.map((plat) => (
                <PlatRow key={plat.id} plat={plat} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
