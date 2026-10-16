import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateLivreur, useDeleteLivreur, useLivreurs, useUpdateLivreur } from '@/api/livreurs';
import { ZoneSelect } from '@/components/zones/ZoneSelect';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Livreur } from '@/api/types';

function NouveauLivreurForm({ onFermer }: { onFermer: () => void }) {
  const createLivreur = useCreateLivreur();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [plafondAvance, setPlafondAvance] = useState('50000');
  const [plafondCaisse, setPlafondCaisse] = useState('100000');

  return (
    <form
      className="space-y-4 rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-md"
      onSubmit={(event) => {
        event.preventDefault();
        createLivreur.mutate(
          {
            telephone,
            motDePasse,
            nom,
            zoneId,
            plafondAvance: Number(plafondAvance),
            plafondCaisse: Number(plafondCaisse),
          },
          {
            onSuccess: () => {
              toast.success('Livreur créé avec succès.');
              onFermer();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="border-b border-border/60 pb-3">
        <h2 className="font-heading font-bold text-lg text-foreground">Ajouter un nouveau livreur</h2>
        <p className="text-xs text-muted-foreground">Création du compte coursier et affectation de zone de départ.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="livreur-nom" className="text-xs font-semibold">Nom complet *</Label>
          <Input id="livreur-nom" value={nom} onChange={(e) => setNom(e.target.value)} required className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="livreur-telephone" className="text-xs font-semibold">Téléphone de connexion *</Label>
          <Input
            id="livreur-telephone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="+229 01 00 00 00"
            className="rounded-xl font-mono"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="livreur-mdp" className="text-xs font-semibold">Mot de passe provisoire *</Label>
          <Input
            id="livreur-mdp"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="rounded-xl"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="livreur-zone" className="text-xs font-semibold">Zone d'attachement *</Label>
          <ZoneSelect id="livreur-zone" value={zoneId} onChange={setZoneId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="livreur-plafond-avance" className="text-xs font-semibold">Plafond d'avance (FCFA) *</Label>
          <Input
            id="livreur-plafond-avance"
            type="number"
            min="0"
            value={plafondAvance}
            onChange={(e) => setPlafondAvance(e.target.value)}
            className="rounded-xl font-mono"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="livreur-plafond-caisse" className="text-xs font-semibold">Plafond de caisse (FCFA) *</Label>
          <Input
            id="livreur-plafond-caisse"
            type="number"
            min="0"
            value={plafondCaisse}
            onChange={(e) => setPlafondCaisse(e.target.value)}
            className="rounded-xl font-mono"
            required
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/60">
        <Button
          type="submit"
          disabled={createLivreur.isPending}
          className="h-10 rounded-xl font-bold bg-primary text-white px-6"
        >
          {createLivreur.isPending ? 'Création...' : 'Créer le livreur'}
        </Button>
        <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={onFermer}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function LivreurRow({ livreur }: { livreur: Livreur }) {
  const updateLivreur = useUpdateLivreur();
  const supprimer = useDeleteLivreur();
  const [edition, setEdition] = useState(false);
  const [zoneId, setZoneId] = useState(livreur.zone.id);
  const [plafondAvance, setPlafondAvance] = useState(livreur.plafondAvance);
  const [plafondCaisse, setPlafondCaisse] = useState(livreur.plafondCaisse);
  const [motDePasse, setMotDePasse] = useState('');

  if (!edition) {
    return (
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3.5">
          <div className="font-semibold text-foreground">{livreur.user.nom}</div>
          <a href={`tel:${livreur.user.telephone}`} className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
            {livreur.user.telephone}
          </a>
        </td>
        <td className="px-4 py-3.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-2xs',
              livreur.disponible
                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                : 'bg-muted text-muted-foreground border border-border/60',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                livreur.disponible ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50',
              )}
            />
            {livreur.disponible ? 'Disponible' : 'Indisponible'}
          </span>
        </td>
        <td className="px-4 py-3.5 font-medium text-foreground">{livreur.zone.nom}</td>
        <td className="px-4 py-3.5 font-mono text-xs">{formatPrixFcfa(livreur.plafondAvance)}</td>
        <td className="px-4 py-3.5 font-mono text-xs">{formatPrixFcfa(livreur.plafondCaisse)}</td>
        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">{formatPrixFcfa(livreur.avanceEnCours)}</td>
        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{formatPrixFcfa(livreur.caisseAReverser)}</td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs font-semibold" onClick={() => setEdition(true)}>
              Modifier
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Supprimer ce livreur"
              aria-label={`Supprimer ${livreur.user.nom}`}
              disabled={supprimer.isPending}
              onClick={() => {
                if (!window.confirm(`Supprimer définitivement le compte de ${livreur.user.nom} ? Cette action est irréversible. Un compte avec un historique de commandes ou de caisse ne peut pas être supprimé.`)) {
                  return;
                }
                supprimer.mutate(
                  { id: livreur.id },
                  {
                    onSuccess: () => toast.success('Livreur supprimé.'),
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-primary/5">
      <td className="px-4 py-3.5">
        <div className="font-semibold text-foreground">{livreur.user.nom}</div>
        <div className="text-xs font-mono text-muted-foreground">{livreur.user.telephone}</div>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
            livreur.disponible ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground',
          )}
        >
          {livreur.disponible ? 'Disponible' : 'Indisponible'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <ZoneSelect value={zoneId} onChange={setZoneId} />
      </td>
      <td className="px-4 py-3.5">
        <Input
          type="number"
          min="0"
          className="h-8 w-28 rounded-xl font-mono text-xs"
          value={plafondAvance}
          onChange={(e) => setPlafondAvance(e.target.value)}
        />
      </td>
      <td className="px-4 py-3.5">
        <Input
          type="number"
          min="0"
          className="h-8 w-28 rounded-xl font-mono text-xs"
          value={plafondCaisse}
          onChange={(e) => setPlafondCaisse(e.target.value)}
        />
      </td>
      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{formatPrixFcfa(livreur.avanceEnCours)}</td>
      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{formatPrixFcfa(livreur.caisseAReverser)}</td>
      <td className="px-4 py-3.5 text-right">
        <div className="flex min-w-52 flex-col items-end gap-2">
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Nouveau mot de passe"
            aria-label={`Nouveau mot de passe pour ${livreur.user.nom}`}
            className="h-8 w-full rounded-xl text-xs"
            value={motDePasse}
            onChange={(event) => setMotDePasse(event.target.value)}
          />
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              className="h-8 rounded-xl text-xs font-bold bg-primary text-white"
              disabled={updateLivreur.isPending}
              onClick={() => {
                updateLivreur.mutate(
                  {
                    id: livreur.id,
                    dto: {
                      zoneId,
                      plafondAvance: Number(plafondAvance),
                      plafondCaisse: Number(plafondCaisse),
                      motDePasse: motDePasse || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        motDePasse
                          ? 'Livreur mis à jour et mot de passe modifié.'
                          : 'Livreur mis à jour.',
                      );
                      setMotDePasse('');
                      setEdition(false);
                    },
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              Enregistrer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-xl text-xs"
              onClick={() => {
                setMotDePasse('');
                setEdition(false);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function LivreursPage() {
  const { data: livreurs, isPending } = useLivreurs();
  const [creationOuverte, setCreationOuverte] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Flotte de livreurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion de l'équipe des coursiers, zones d'intervention et suivi des plafonds de caisse.
          </p>
        </div>
        {!creationOuverte && (
          <Button
            className="gap-2 rounded-full bg-primary px-4 font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all self-start sm:self-auto"
            onClick={() => setCreationOuverte(true)}
          >
            <Plus className="size-4" />
            Nouveau livreur
          </Button>
        )}
      </div>

      {creationOuverte && <NouveauLivreurForm onFermer={() => setCreationOuverte(false)} />}

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : !livreurs || livreurs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center shadow-xs">
          <p className="font-heading text-lg font-bold text-foreground">Aucun coursier enregistré</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez les premiers livreurs de la flotte ChapExpress.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Livreur</th>
                <th className="px-4 py-3">Disponibilité</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Plafond avance</th>
                <th className="px-4 py-3">Plafond caisse</th>
                <th className="px-4 py-3">Avance en cours</th>
                <th className="px-4 py-3">Solde à reverser</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {livreurs.map((livreur) => (
                <LivreurRow key={livreur.id} livreur={livreur} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
