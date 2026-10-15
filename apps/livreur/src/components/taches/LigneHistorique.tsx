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
    <li className="flex items-center justify-between gap-3.5 rounded-3xl bg-card px-4 py-3.5 border border-border/70 shadow-xs transition-all hover:border-primary/30">
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading font-bold text-foreground text-sm">{titre(tache)}</p>
        <p className="truncate text-xs text-muted-foreground mt-0.5">
          {SERVICE_LABELS[tache.service]} · {anciennete(tache.createdAt)}
          {montant ? ` · ${formatPrixFcfa(montant)}` : ''}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold',
          reussie
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-destructive/10 text-destructive border border-destructive/20',
        )}
      >
        {libelleStatut(tache.service, tache.statut)}
      </span>
    </li>
  );
}
