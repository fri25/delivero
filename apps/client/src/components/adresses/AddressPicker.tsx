import { useEffect, useState } from 'react';
import { CircleAlert, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdresses } from '@/api/adresses';
import type { Adresse } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { AddressForm } from './AddressForm';

export function AddressPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (adresseId: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Address saved before 13/10 without a priced neighbourhood: completed here.
  const [aCompleter, setACompleter] = useState<Adresse | null>(null);
  const { data: adresses, isPending, isError, refetch } = useAdresses();

  useEffect(() => {
    if (adresses && value && !adresses.some((adresse) => adresse.id === value)) onChange('');
  }, [adresses, onChange, value]);

  // Preselect the default address so most orders need no tap here — also
  // when a pre-filled value (reorder) points to an address deleted since.
  const adresseParDefaut = adresses?.find((adresse) => adresse.estParDefaut) ?? adresses?.at(0);
  const valeurConnue = Boolean(value && adresses?.some((adresse) => adresse.id === value));
  useEffect(() => {
    if (adresses && !valeurConnue && adresseParDefaut) onChange(adresseParDefaut.id);
  }, [adresses, valeurConnue, adresseParDefaut, onChange]);

  const choisie = adresses?.find((adresse) => adresse.id === value);
  const choisieSansQuartier = choisie && !choisie.quartierTarifaire ? choisie : undefined;

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Chargement des adresses...</p>;
  }

  if (isError) {
    return <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm"><p>Le carnet d’adresses n’a pas pu être chargé.</p><Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void refetch()}>Réessayer</Button></div>;
  }

  return (
    <div className="space-y-2">
      {adresses?.map((adresse) => (
        <button
          key={adresse.id}
          type="button"
          onClick={() => onChange(adresse.id)}
          className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
            value === adresse.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border hover:border-brand-blue/50'
          }`}
        >
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{adresse.libelle}</span>
            {adresse.quartierTarifaire && (
              <span className="shrink-0 text-xs text-muted-foreground">
                Livraison {formatPrixFcfa(adresse.quartierTarifaire.fraisLivraison)}
              </span>
            )}
          </p>
          <p>
            {[adresse.quartier, adresse.adresse].filter(Boolean).join(' · ')}
          </p>
          <p className="text-muted-foreground">{adresse.pointDeRepere}</p>
          {!adresse.quartierTarifaire && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" aria-hidden="true" /> Quartier à préciser
            </p>
          )}
        </button>
      ))}

      {choisieSansQuartier && (
        <Button type="button" size="sm" className="w-full" onClick={() => setACompleter(choisieSansQuartier)}>
          Indiquer le quartier de « {choisieSansQuartier.libelle} »
        </Button>
      )}

      <Dialog open={aCompleter !== null} onOpenChange={(open) => !open && setACompleter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compléter l’adresse</DialogTitle>
          </DialogHeader>
          {aCompleter && <AddressForm adresse={aCompleter} onSaved={() => setACompleter(null)} />}
        </DialogContent>
      </Dialog>

      {adresses?.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune adresse enregistrée pour l'instant.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Nouvelle adresse
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle adresse</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSaved={(adresse) => {
              onChange(adresse.id);
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
