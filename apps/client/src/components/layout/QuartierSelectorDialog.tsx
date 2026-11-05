import { useState } from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuartiers } from '@/api/quartiers';
import { useLocationStore } from '@/stores/location-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAdresses } from '@/api/adresses';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useEntreprise } from '@/lib/entreprise';

/**
 * Delivery-zone picker. `hero`: white pill on the blue home banner;
 * `compact`: inline text in the desktop header.
 */
export function QuartierSelectorDialog({
  variante = 'compact',
  className,
}: {
  variante?: 'hero' | 'compact';
  className?: string;
}) {
  const entreprise = useEntreprise();
  const [open, setOpen] = useState(false);
  const { data: quartiers, isPending } = useQuartiers();
  const token = useAuthStore((state) => state.token);
  const { data: adresses } = useAdresses();
  const { quartierId, quartierNom, setQuartier } = useLocationStore();

  // Si l'utilisateur est connecté et qu'il a une adresse par défaut sans sélection explicite
  const adresseDefaut = adresses?.find((a) => a.estParDefaut) ?? adresses?.[0];
  const quartierActuel =
    quartierNom ??
    adresseDefaut?.quartierTarifaire?.nom ??
    adresseDefaut?.quartier ??
    null;

  const choisirQuartier = (id: string, nom: string, frais: string | number) => {
    setQuartier(id, nom, Number(frais));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-11 cursor-pointer items-center gap-2 text-left text-sm',
            variante === 'compact' && 'text-muted-foreground',
            variante === 'hero' && 'rounded-full bg-white/15 px-3.5 text-white hover:bg-white/20',
            className,
          )}
          aria-label={quartierActuel ? `Livraison à ${quartierActuel}. Changer de quartier` : 'Choisir mon quartier de livraison'}
        >
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {quartierActuel ? (
              <>
                Livrer à <strong className={cn('font-bold', variante === 'compact' && 'text-foreground')}>{quartierActuel}</strong>
              </>
            ) : (
              <strong className={cn('font-bold', variante === 'compact' && 'text-foreground')}>Choisir mon quartier</strong>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="font-heading text-2xl font-extrabold text-foreground">
            Où souhaitez-vous être livré ?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Choisissez votre quartier pour afficher les frais de livraison exacts.
          </DialogDescription>
        </DialogHeader>

        {token && adresses && adresses.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <p className="text-sm font-bold text-foreground">
              Vos adresses enregistrées
            </p>
            <div className="grid gap-1.5">
              {adresses.map((adr) => {
                const qNom = adr.quartierTarifaire?.nom ?? adr.quartier ?? 'Quartier non renseigné';
                const estSelectionne =
                  adr.quartierTarifaire?.id === quartierId || (!quartierId && adr.estParDefaut);

                return (
                  <button
                    key={adr.id}
                    type="button"
                    onClick={() => {
                      if (adr.quartierTarifaire) {
                        choisirQuartier(
                          adr.quartierTarifaire.id,
                          adr.quartierTarifaire.nom,
                          adr.quartierTarifaire.fraisLivraison,
                        );
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 text-left transition-colors cursor-pointer',
                      estSelectionne
                        ? 'border-primary bg-accent'
                        : 'border-border/70 bg-card hover:bg-secondary/50',
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-bold text-foreground truncate">{adr.libelle}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {adr.pointDeRepere} • <span className="font-medium text-primary">{qNom}</span>
                      </p>
                    </div>
                    {estSelectionne && (
                      <Check className="size-4 shrink-0 stroke-[3] text-primary" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <p className="text-sm font-bold text-foreground">
            Tous les quartiers de {entreprise.ville}
          </p>

          {isPending ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Chargement des quartiers...
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
              {quartiers?.map((q) => {
                const estSelectionne = q.id === quartierId;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => choisirQuartier(q.id, q.nom, q.fraisLivraison)}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm transition-colors cursor-pointer',
                      estSelectionne
                        ? 'bg-accent font-bold text-primary'
                        : 'hover:bg-secondary text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span>{q.nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-xs font-bold tabular-nums',
                          estSelectionne ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {formatPrixFcfa(Number(q.fraisLivraison))}
                      </span>
                      {estSelectionne && <Check className="size-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {token && (
          <div className="pt-2 text-center border-t border-border/50">
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold">
              <Link to="/adresses" onClick={() => setOpen(false)}>
                Gérer mes adresses enregistrées →
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
