import type { Tache } from '@/api/taches';
import { ColisDisponibleCard } from '@/components/colis/ColisDisponibleCard';
import { MonColisCard } from '@/components/colis/MonColisCard';
import { CoursesExpressDisponibleCard } from '@/components/courses-express/CoursesExpressDisponibleCard';
import { MaCourseExpressCard } from '@/components/courses-express/MaCourseExpressCard';
import { CourseDisponibleCard } from '@/components/courses/CourseDisponibleCard';
import { MaCourseCard } from '@/components/courses/MaCourseCard';
import { EmplettesDisponibleCard } from '@/components/emplettes/EmplettesDisponibleCard';
import { MonEmplettesCard } from '@/components/emplettes/MonEmplettesCard';
import { ServiceBandeau } from '@/components/taches/ServiceBandeau';
import { DemarrerCourse } from '@/components/taches/DemarrerCourse';
import { estAttribueeNonDemarree, libelleStatut } from '@/lib/taches';

/**
 * One task in a unified list: the service frame, then the existing service
 * card — "disponible" to take it, "mienne" to move it forward.
 */
export function CarteTache({ tache, mode }: { tache: Tache; mode: 'disponible' | 'mienne' }) {
  const statut = mode === 'mienne' ? libelleStatut(tache.service, tache.statut) : undefined;
  const ton = tache.statut === 'litige' ? 'alerte' : 'actif';

  return (
    <ServiceBandeau service={tache.service} commandeId={tache.id} date={tache.createdAt} statut={statut} statutTon={ton}>
      {mode === 'mienne' && estAttribueeNonDemarree(tache.service, tache.statut) && <DemarrerCourse tache={tache} />}
      {tache.service === 'repas' &&
        (mode === 'disponible' ? <CourseDisponibleCard commande={tache.commande} /> : <MaCourseCard commande={tache.commande} />)}
      {tache.service === 'colis' &&
        (mode === 'disponible' ? <ColisDisponibleCard commande={tache.commande} /> : <MonColisCard commande={tache.commande} />)}
      {tache.service === 'courses_express' &&
        (mode === 'disponible' ? (
          <CoursesExpressDisponibleCard commande={tache.commande} />
        ) : (
          <MaCourseExpressCard commande={tache.commande} />
        ))}
      {tache.service === 'emplettes' &&
        (mode === 'disponible' ? (
          <EmplettesDisponibleCard commande={tache.commande} />
        ) : (
          <MonEmplettesCard commande={tache.commande} />
        ))}
    </ServiceBandeau>
  );
}
