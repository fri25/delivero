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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Menu du restaurant</h1>
          {plats && plats.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {plats.length} plat{plats.length > 1 ? 's' : ''} enregistré{plats.length > 1 ? 's' : ''}
              </span>
              {enRupture > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {enRupture} en rupture (masqué{enRupture > 1 ? 's' : ''} aux clients)
                </span>
              )}
            </div>
          )}
        </div>
        {!ajoutOuvert && (
          <Button
            className="h-10 shrink-0 gap-2 rounded-full bg-primary px-4 font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
            onClick={() => setAjoutOuvert(true)}
          >
            <Plus className="size-4.5" aria-hidden="true" />
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
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      ) : groupes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center shadow-xs">
          <p className="font-heading text-lg font-bold text-foreground">Votre carte est encore vide</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Ajoutez vos spécialités et boissons pour que les clients puissent les commander en livraison.
          </p>
          {!ajoutOuvert && (
            <Button
              className="mt-4 gap-2 rounded-full font-bold"
              onClick={() => setAjoutOuvert(true)}
            >
              <Plus className="size-4" />
              Créer mon premier plat
            </Button>
          )}
        </div>
      ) : (
        groupes.map(([categorie, platsDuGroupe]) => (
          <section key={categorie} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <h2 className="font-heading text-sm font-bold tracking-wider text-muted-foreground uppercase">
                {categorie}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                {platsDuGroupe.length}
              </span>
            </div>
            <ul className="grid gap-3 lg:grid-cols-2">
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
