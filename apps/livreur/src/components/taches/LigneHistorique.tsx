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

export function LigneHistorique({ tache }: { tache: Tache }) {
  const montant = tache.commande.commande.montantTotal;
  const reussie = estReussie(tache.statut);
  return (
    <li className="carte flex items-center justify-between gap-3.5 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold">{titre(tache)}</p>
        <p className="truncate text-xs text-muted-foreground mt-0.5">
          {SERVICE_LABELS[tache.service]} · {anciennete(tache.createdAt)}
          {montant ? ` · ${formatPrixFcfa(montant)}` : ''}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold',
          reussie
            ? 'bg-accent text-primary'
            : 'bg-destructive/10 text-destructive border border-destructive/20',
        )}
      >
        {libelleStatut(tache.service, tache.statut)}
      </span>
    </li>
  );
}
