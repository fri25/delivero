import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { Bike, CreditCard, MapPin } from 'lucide-react';

const ETAPES = [
  {
    icon: MapPin,
    titre: '1. Vous commandez',
    texte: 'Choisissez vos plats ou indiquez vos adresses avec un point de repère familier.',
  },
  {
    icon: CreditCard,
    titre: '2. Vous payez',
    texte: ESPECES_ACTIF
      ? 'Par Mobile Money en ligne, ou en espèces à la livraison.'
      : 'En toute sécurité par Mobile Money (MTN MoMo, Moov, Celtiis).',
  },
  {
    icon: Bike,
    titre: '3. Vous êtes livré',
    texte: "Un livreur ChapExpress prend la route. Suivez son avancée en direct jusqu'à chez vous.",
  },
];

/** Guide en 3 étapes pour les nouveaux utilisateurs. */
export function CommentCaMarche() {
  return (
    <section aria-labelledby="comment-ca-marche" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="comment-ca-marche" className="font-heading text-lg font-bold text-foreground sm:text-xl">
          Comment ça marche ?
        </h2>
        <span className="text-xs font-medium text-muted-foreground">Simple et rapide</span>
      </div>
      <ol className="grid gap-3.5 sm:grid-cols-3">
        {ETAPES.map((etape) => {
          const Icon = etape.icon;
          return (
            <li
              key={etape.titre}
              className="group flex gap-3.5 rounded-3xl bg-card p-4.5 ring-1 ring-foreground/10 shadow-2xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 sm:flex-col sm:gap-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-foreground">{etape.titre}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{etape.texte}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
