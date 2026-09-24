import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { History, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { ActiveOrderBanner } from '@/components/home/ActiveOrderBanner';
import { ServiceTile, type TileSlide } from '@/components/home/ServiceTile';
import { ColisIllustration } from '@/components/home/illustrations/ColisIllustration';
import { CoursesExpressIllustration } from '@/components/home/illustrations/CoursesExpressIllustration';
import { EmplettesIllustration } from '@/components/home/illustrations/EmplettesIllustration';
import { getPlatImage } from '@/data/images';

// Un plat du catalogue de démo pour la tuile Repas (seul service avec de
// vraies photos).
const REPAS_SLIDE: TileSlide = { image: getPlatImage('Poisson tilapia braisé') };

// Colis / Courses express / Emplettes n'ont aucune vraie photo (aucun
// partenaire/livreur n'a encore fourni de visuel) : illustrations
// vectorielles maison en attendant, à remplacer par de vraies photos plus
// tard.
const COLIS_SLIDE: TileSlide = { illustration: <ColisIllustration variant={1} /> };
const COURSES_EXPRESS_SLIDE: TileSlide = {
  illustration: <CoursesExpressIllustration variant={1} />,
};
const EMPLETTES_SLIDE: TileSlide = { illustration: <EmplettesIllustration variant={1} /> };

// Numéro support à confirmer avant mise en production.
const WHATSAPP_SUPPORT = 'https://wa.me/22900000000';

export function ServicesHubPage() {
  return (
    <div className="space-y-4">
      <ActiveOrderBanner />

      <section className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-foreground/10">
        <img src={logo} alt="ChapExpress" className="h-14 w-auto shrink-0" />
        <p className="text-xs leading-snug text-muted-foreground">
          À Natitingou, ChapExpress livre{' '}
          {EMPLETTES_ACTIF ? 'vos repas, colis, courses et emplettes' : 'vos repas, colis et courses'}{' '}
          grâce à des livreurs de confiance. Choisissez un service pour commencer.
        </p>
      </section>

      {/* 4 tuiles = 2 lignes pleines. Emplettes masqué en V1, les 3 restantes
          laisseraient un demi-emplacement vide : Repas, le service phare et le
          seul à avoir de vraies photos, prend alors toute la largeur. */}
      <section className="grid grid-cols-2 gap-3">
        <div className={EMPLETTES_ACTIF ? undefined : 'col-span-2'}>
          <ServiceTile
            to="/repas"
            label="Repas"
            description="Restaurants et plats livrés chez vous"
            slide={REPAS_SLIDE}
          />
        </div>
        <ServiceTile
          to="/colis"
          label="Colis"
          description="Enlèvement et livraison, point A à point B"
          slide={COLIS_SLIDE}
        />
        <ServiceTile
          to="/courses-express"
          label="Courses express"
          description="Démarches, dépôts et achats en votre nom"
          slide={COURSES_EXPRESS_SLIDE}
        />
        {EMPLETTES_ACTIF && (
          <ServiceTile
            to="/emplettes"
            label="Emplettes"
            description="Marché, supermarché, pharmacie"
            slide={EMPLETTES_SLIDE}
          />
        )}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link
          to="/commandes"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-card px-3 text-sm font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-secondary"
        >
          <History className="size-4 shrink-0" aria-hidden="true" />
          Mes commandes
        </Link>
        <a
          href={WHATSAPP_SUPPORT}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-card px-3 text-sm font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-secondary"
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
          Aide WhatsApp
        </a>
      </section>
    </div>
  );
}
