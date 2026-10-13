import { TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { Clock, Star } from 'lucide-react';
import { FilterChip } from '@/components/restaurants/FilterChip';
import {
  DELAI_MAX_MIN,
  NOTE_MIN,
  TRANCHES_PRIX,
  type FiltresCatalogue,
  type TranchePrix,
} from '@/lib/filtres-catalogue';

// F-CLI-11 : filtres cuisine / prix / note / délai, en une seule rangée de
// puces défilantes (pas de panneau à ouvrir : un tap par filtre sur mobile).
export function CatalogueFilters({
  filtres,
  onChange,
}: {
  filtres: FiltresCatalogue;
  onChange: (filtres: FiltresCatalogue) => void;
}) {
  const basculer = <K extends keyof FiltresCatalogue>(cle: K, valeur: FiltresCatalogue[K], vide: FiltresCatalogue[K]) =>
    onChange({ ...filtres, [cle]: filtres[cle] === valeur ? vide : valeur });

  return (
    <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
      <FilterChip actif={filtres.ouvertsSeulement} onClick={() => basculer('ouvertsSeulement', true, false)}>
        Ouverts maintenant
      </FilterChip>
      <FilterChip actif={filtres.bienNotes} onClick={() => basculer('bienNotes', true, false)}>
        <Star className="size-3.5" aria-hidden="true" />
        {NOTE_MIN} et plus
      </FilterChip>
      <FilterChip actif={filtres.rapides} onClick={() => basculer('rapides', true, false)}>
        <Clock className="size-3.5" aria-hidden="true" />
        {DELAI_MAX_MIN} min max
      </FilterChip>
      {(Object.keys(TRANCHES_PRIX) as TranchePrix[]).map((tranche) => (
        <FilterChip
          key={tranche}
          actif={filtres.prix === tranche}
          onClick={() => basculer('prix', tranche, null)}
        >
          {TRANCHES_PRIX[tranche].label}
        </FilterChip>
      ))}
      <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden="true" />
      {TYPES_CUISINE.map((cuisine) => (
        <FilterChip key={cuisine} actif={filtres.cuisine === cuisine} onClick={() => basculer('cuisine', cuisine, null)}>
          {cuisine}
        </FilterChip>
      ))}
    </div>
  );
}
