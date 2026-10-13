import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';

// Mobile Money is paid at order time (an unpaid order reaches no one), cash at
// delivery: the wording follows the V1 perimeter.
const ETAPES = [
  {
    titre: 'Vous commandez',
    texte: 'Choisissez un service et indiquez un point de repère connu (boutique, école, carrefour).',
  },
  {
    titre: 'Vous payez',
    texte: ESPECES_ACTIF
      ? 'Par Mobile Money en ligne, ou en espèces à la livraison.'
      : 'Par Mobile Money, directement depuis votre téléphone.',
  },
  {
    titre: 'On vous livre',
    texte: "Un livreur ChapExpress s'en charge. Vous suivez chaque étape en direct.",
  },
];

/** Three-step explainer for first-time users of the home screen. */
export function CommentCaMarche() {
  return (
    <section aria-labelledby="comment-ca-marche" className="space-y-3">
      <h2 id="comment-ca-marche" className="font-heading text-lg font-semibold">
        Comment ça marche ?
      </h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {ETAPES.map((etape, index) => (
          <li key={etape.titre} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:flex-col">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h3 className="font-semibold">{etape.titre}</h3>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{etape.texte}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
