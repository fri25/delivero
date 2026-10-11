import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressForm } from '@/components/adresses/AddressForm';
import { useAdresses, useDefinirAdresseParDefaut, useSupprimerAdresse } from '@/api/adresses';
import type { Adresse } from '@/api/types';
import { lienGoogleMaps } from '@/lib/geolocalisation';

// F-CLI-03 : carnet d'adresses.
export function AdressesPage() {
  const { data: adresses, isPending } = useAdresses();
  const definirParDefaut = useDefinirAdresseParDefaut();
  const supprimer = useSupprimerAdresse();
  // undefined = dialog closed, null = new address, Adresse = editing it.
  const [enEdition, setEnEdition] = useState<Adresse | null | undefined>(undefined);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mes adresses</h1>
        <Button size="sm" onClick={() => setEnEdition(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      {!adresses || adresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune adresse enregistrée. Ajoutez votre domicile ou votre bureau pour commander plus vite.
        </p>
      ) : (
        <ul className="space-y-3">
          {adresses.map((adresse) => (
            <li key={adresse.id} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{adresse.libelle}</p>
                  <p className="text-sm text-muted-foreground">{adresse.pointDeRepere}</p>
                  {adresse.latitude && adresse.longitude && (
                    <a
                      href={lienGoogleMaps(adresse.latitude, adresse.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline"
                    >
                      <MapPin className="size-3" aria-hidden="true" />
                      Position GPS enregistrée
                    </a>
                  )}
                </div>
                {adresse.estParDefaut && <Badge variant="secondary">Par défaut</Badge>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEnEdition(adresse)}>
                  Modifier
                </Button>
                {!adresse.estParDefaut && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={definirParDefaut.isPending}
                    onClick={() =>
                      definirParDefaut.mutate(adresse.id, {
                        onError: (error) => toast.error(error.message),
                      })
                    }
                  >
                    Par défaut
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={supprimer.isPending}
                  onClick={() => {
                    if (!window.confirm(`Supprimer l'adresse « ${adresse.libelle} » ?`)) return;
                    supprimer.mutate(adresse.id, {
                      onSuccess: () => toast.success('Adresse supprimée.'),
                      onError: (error) => toast.error(error.message),
                    });
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={enEdition !== undefined} onOpenChange={(open) => !open && setEnEdition(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{enEdition ? "Modifier l'adresse" : 'Nouvelle adresse'}</DialogTitle>
          </DialogHeader>
          {enEdition !== undefined && (
            <AddressForm
              key={enEdition?.id ?? 'nouvelle'}
              adresse={enEdition ?? undefined}
              onSaved={() => {
                toast.success('Adresse enregistrée.');
                setEnEdition(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
