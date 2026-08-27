import { Badge } from '@/components/ui/badge';
import { CoursesExpressInfo } from './CoursesExpressInfo';
import { EtapeRealisationRow } from './EtapeRealisationRow';
import { LitigeCoursesExpressForm } from './LitigeCoursesExpressForm';
import { STATUT_COURSES_EXPRESS_LABELS } from '@/lib/statut-courses-express';
import type { CommandeCoursesExpress } from '@/api/types';

export function MaCourseExpressCard({ commande }: { commande: CommandeCoursesExpress }) {
  const pointageBloque = commande.statut !== 'en_cours' && commande.statut !== 'etape_realisee';
  // Le backend n'autorise le litige que depuis en_cours (voir
  // commandes-courses-express.service.ts) — pas depuis etape_realisee, pour
  // rester strictement fidèle à la machine à états du cahier des charges.
  const peutSignalerLitige = commande.statut === 'en_cours';

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
        <Badge variant={commande.statut === 'terminee' ? 'outline' : 'default'}>
          {STATUT_COURSES_EXPRESS_LABELS[commande.statut]}
        </Badge>
      </div>

      <CoursesExpressInfo commande={commande} />

      <div>
        {commande.etapes.map((etape) => (
          <EtapeRealisationRow
            key={etape.id}
            commandeId={commande.id}
            etape={etape}
            disabled={pointageBloque}
          />
        ))}
      </div>

      {commande.statut === 'litige' && commande.motif && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-sm text-destructive">
          {commande.motif}
        </p>
      )}

      {peutSignalerLitige && <LitigeCoursesExpressForm commandeId={commande.id} />}
    </div>
  );
}
