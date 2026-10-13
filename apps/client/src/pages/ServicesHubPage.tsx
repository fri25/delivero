import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { MessageCircle } from 'lucide-react';
import { ActiveOrderBanner } from '@/components/home/ActiveOrderBanner';
import { ActiverNotificationsCard } from '@/components/home/ActiverNotificationsCard';
import { CommandesInviteCard } from '@/components/home/CommandesInviteCard';
import { CommentCaMarche } from '@/components/home/CommentCaMarche';
import { ServiceTile, type TileSlide } from '@/components/home/ServiceTile';
import { EmplettesIllustration } from '@/components/home/illustrations/EmplettesIllustration';
import { Button } from '@/components/ui/button';
import { getPlatImage, getServiceImage } from '@/data/images';
import { InstallAppPrompt } from '@/components/layout/InstallAppPrompt';
import { WHATSAPP_SUPPORT } from '@/lib/support';
import { useAuthStore } from '@/stores/auth-store';

// Un plat du catalogue de démo pour la carte Repas (seul service avec de
// vraies photos).
const REPAS_SLIDE: TileSlide = { image: getPlatImage('Poisson tilapia braisé') };

// Colis / Courses express : photos Pexels (licence libre) en attendant de
// vraies photos de livreurs ChapExpress — voir getServiceImage. Carré sur
// mobile, recadrage large sur PC.
const PHOTO_COLIS = getServiceImage('colis');
const COLIS_SLIDE: TileSlide = { image: PHOTO_COLIS.square, imageLarge: PHOTO_COLIS.wide };
const PHOTO_COURSES_EXPRESS = getServiceImage('courses-express');
const COURSES_EXPRESS_SLIDE: TileSlide = {
  image: PHOTO_COURSES_EXPRESS.square,
  imageLarge: PHOTO_COURSES_EXPRESS.wide,
};
// Emplettes (masqué en V1) n'a toujours pas de photo : illustration maison.
const EMPLETTES_SLIDE: TileSlide = { illustration: <EmplettesIllustration variant={1} /> };

export function ServicesHubPage() {
  const user = useAuthStore((state) => state.user);
  const prenom = user?.nom.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:max-w-6xl lg:space-y-10">
      <ActiveOrderBanner />

      <header>
        <p className="text-sm font-medium text-muted-foreground">
          {prenom ? `Bonjour ${prenom},` : 'Bienvenue sur ChapExpress'}
        </p>
        <h1 className="font-heading mt-0.5 text-[1.7rem] leading-tight font-semibold text-foreground lg:text-4xl">
          Que voulez-vous faire livrer à Natitingou ?
        </h1>
        <p className="mt-2 hidden max-w-2xl text-muted-foreground lg:block">
          Repas, colis ou course en ville : choisissez un service, un livreur ChapExpress s'occupe du reste.
        </p>
      </header>

      <section aria-label="Nos services" className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-5">
        <ServiceTile
          vedette
          className="col-span-2 lg:col-span-3 lg:row-span-2"
          to="/repas"
          label="Repas"
          description="Les plats des restaurants de Natitingou, livrés chez vous."
          action="Voir les restaurants"
          slide={REPAS_SLIDE}
        />
        <ServiceTile
          className="lg:col-span-2"
          to="/colis"
          label="Envoyer un colis"
          description="Un livreur récupère votre colis et le remet à votre destinataire."
          action="Envoyer"
          slide={COLIS_SLIDE}
        />
        <ServiceTile
          className="lg:col-span-2"
          to="/courses-express"
          label="Faire une course"
          description="Retirer un document, déposer un paquet : un livreur y va pour vous."
          action="Demander une course"
          slide={COURSES_EXPRESS_SLIDE}
        />
        {EMPLETTES_ACTIF && (
          <ServiceTile
            className="col-span-2"
            to="/emplettes"
            label="Emplettes"
            description="Marché, supermarché, pharmacie : donnez votre liste, on achète pour vous."
            action="Faire ma liste"
            slide={EMPLETTES_SLIDE}
          />
        )}
      </section>

      <ActiverNotificationsCard />
      <CommandesInviteCard />

      <CommentCaMarche />

      <section className="flex flex-col gap-3 rounded-2xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Une question avant de commander ?</h2>
          <p className="text-sm text-muted-foreground">Notre équipe vous répond sur WhatsApp.</p>
        </div>
        <Button asChild variant="outline" className="bg-card">
          <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer">
            <MessageCircle /> Écrire sur WhatsApp
          </a>
        </Button>
      </section>

      <InstallAppPrompt />
    </div>
  );
}
