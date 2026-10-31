import { useState } from 'react';
import { Check, ChevronDown, MapPin, Sparkles } from 'lucide-react';
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

export function QuartierSelectorDialog({ className }: { className?: string }) {
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
    'Choisir mon quartier';

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
            'group flex min-h-9 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors duration-200 hover:bg-primary/10 active:scale-95 cursor-pointer',
            className,
          )}
          aria-label={`Zone de livraison actuelle : ${quartierActuel}. Cliquez pour modifier.`}
        >
          <MapPin className="size-3.5 text-brand-red shrink-0" aria-hidden="true" />
          <span className="font-semibold max-w-[120px] sm:max-w-[200px] truncate">
            {quartierActuel}
          </span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary w-fit">
            <Sparkles className="size-3" />
            <span>Livraison à Natitingou</span>
          </div>
          <DialogTitle className="font-heading text-lg sm:text-xl font-bold text-foreground">
            Où souhaitez-vous être livré ?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Choisissez votre quartier pour afficher les frais de livraison exacts.
          </DialogDescription>
        </DialogHeader>

        {token && adresses && adresses.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                      'flex items-center justify-between rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer',
                      estSelectionne
                        ? 'border-primary bg-primary/5 shadow-2xs'
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
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tous les quartiers de Natitingou
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
                      'flex w-full items-center justify-between rounded-xl p-2.5 text-left text-sm transition-all duration-150 cursor-pointer',
                      estSelectionne
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'hover:bg-secondary text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={cn('size-4 shrink-0', estSelectionne ? 'text-white' : 'text-primary')}
                      />
                      <span>{q.nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-xs font-bold tabular-nums',
                          estSelectionne
                            ? 'bg-white/20 text-white'
                            : 'bg-secondary text-muted-foreground',
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
