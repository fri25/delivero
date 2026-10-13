import type { Tache } from '@/api/taches';
import { formatPrixFcfa } from '@/lib/format';
import { anciennete, estReussie, libelleStatut, SERVICE_LABELS } from '@/lib/taches';
import { cn } from '@/lib/utils';

function titre(tache: Tache): string {
  switch (tache.service) {
    case 'repas':
      return tache.commande.partenaire.nom;
    case 'colis':
      return `Colis pour ${tache.commande.destinataireNom}`;
    case 'courses_express':
      return tache.commande.description;
    case 'emplettes':
      return tache.commande.lieuAchat ?? 'Emplettes';
  }
}

/** A finished task: one compact line, no actions left. */
export function LigneHistorique({ tache }: { tache: Tache }) {
  const montant = tache.commande.commande.montantTotal;
  const reussie = estReussie(tache.statut);
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="min-w-0">
        <p className="truncate font-medium">{titre(tache)}</p>
        <p className="truncate text-sm text-muted-foreground">
          {SERVICE_LABELS[tache.service]} · {anciennete(tache.createdAt)}
          {montant ? ` · ${formatPrixFcfa(montant)}` : ''}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          reussie ? 'bg-secondary text-foreground' : 'bg-destructive/10 text-destructive',
        )}
      >
        {libelleStatut(tache.service, tache.statut)}
      </span>
    </li>
  );
}
