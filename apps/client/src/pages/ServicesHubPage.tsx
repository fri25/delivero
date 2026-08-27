import { HelpCircle, History, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { ActiveOrderBanner } from '@/components/home/ActiveOrderBanner';
import { ServiceTile, type TileSlide } from '@/components/home/ServiceTile';
import { ColisIllustration } from '@/components/home/illustrations/ColisIllustration';
import { CoursesExpressIllustration } from '@/components/home/illustrations/CoursesExpressIllustration';
import { EmplettesIllustration } from '@/components/home/illustrations/EmplettesIllustration';
import { getPlatImage } from '@/data/images';
import type { ImageVariant } from '@/data/images';

// Plusieurs plats populaires du catalogue de démo, pour faire défiler de
// vraies photos sur la tuile Repas (seul service avec de vraies photos).
const REPAS_SLIDES: TileSlide[] = (
  [
    getPlatImage('Poisson tilapia braisé'),
    getPlatImage('Poulet DG'),
    getPlatImage('Pizza margherita'),
  ].filter(Boolean) as ImageVariant[]
).map((image) => ({ image }));

// Colis / Courses express / Emplettes n'ont aucune vraie photo (aucun
// partenaire/livreur n'a encore fourni de visuel) : illustrations
// vectorielles maison en attendant, à remplacer par de vraies photos plus
// tard.
const COLIS_SLIDES: TileSlide[] = [
  { illustration: <ColisIllustration variant={1} /> },
  { illustration: <ColisIllustration variant={2} /> },
];
const COURSES_EXPRESS_SLIDES: TileSlide[] = [
  { illustration: <CoursesExpressIllustration variant={1} /> },
  { illustration: <CoursesExpressIllustration variant={2} /> },
];
const EMPLETTES_SLIDES: TileSlide[] = [
  { illustration: <EmplettesIllustration variant={1} /> },
  { illustration: <EmplettesIllustration variant={2} /> },
];

const RACCOURCIS = [
  { label: 'Historique', icon: History, to: '/commandes', disabled: false },
  { label: 'Carnet d’adresses', icon: MapPin, to: null, disabled: true },
  { label: 'Promotions', icon: Tag, to: null, disabled: true },
  { label: 'Aide', icon: HelpCircle, to: null, disabled: true },
] as const;

export function ServicesHubPage() {
  return (
    <div className="space-y-4">
      <ActiveOrderBanner />

      <section className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-foreground/10">
        <img src={logo} alt="ChapExpress" className="h-14 w-auto shrink-0" />
        <p className="text-xs leading-snug text-muted-foreground">
          À Natitingou, ChapExpress livre vos repas, colis, courses et emplettes grâce à des
          livreurs de confiance. Choisissez un service pour commencer.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <ServiceTile to="/repas" label="Repas" description="Restaurants et plats livrés chez vous" slides={REPAS_SLIDES} />
        <ServiceTile
          to="/colis"
          label="Colis"
          description="Enlèvement et livraison, point A à point B"
          slides={COLIS_SLIDES}
        />
        <ServiceTile
          to="/courses-express"
          label="Courses express"
          description="Démarches, dépôts et achats en votre nom"
          slides={COURSES_EXPRESS_SLIDES}
        />
        <ServiceTile
          to="/emplettes"
          label="Emplettes"
          description="Marché, supermarché, pharmacie"
          slides={EMPLETTES_SLIDES}
        />
      </section>

      <section className="grid grid-cols-4 gap-2">
        {RACCOURCIS.map(({ label, icon: Icon, to, disabled }) =>
          disabled || !to ? (
            <span
              key={label}
              aria-disabled="true"
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-muted-foreground/50"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">{label}</span>
            </span>
          ) : (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">{label}</span>
            </Link>
          ),
        )}
      </section>
    </div>
  );
}
