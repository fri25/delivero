import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { Bike, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
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

const REPAS_SLIDE: TileSlide = { image: getPlatImage('Poisson tilapia braisé') };

const PHOTO_COLIS = getServiceImage('colis');
const COLIS_SLIDE: TileSlide = { image: PHOTO_COLIS.square, imageLarge: PHOTO_COLIS.wide };

const PHOTO_COURSES_EXPRESS = getServiceImage('courses-express');
const COURSES_EXPRESS_SLIDE: TileSlide = {
  image: PHOTO_COURSES_EXPRESS.square,
  imageLarge: PHOTO_COURSES_EXPRESS.wide,
};

const EMPLETTES_SLIDE: TileSlide = { illustration: <EmplettesIllustration variant={1} /> };

export function ServicesHubPage() {
  const user = useAuthStore((state) => state.user);
  const prenom = user?.nom.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:max-w-6xl lg:space-y-8">
      <ActiveOrderBanner />

      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#002e6e] to-brand-blue p-5 text-white shadow-md sm:p-7 md:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/20">
            <span>⚡ Livraison express</span>
            <span className="size-1 rounded-full bg-white/50" />
            <span>Natitingou & Cotonou</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white leading-tight sm:text-3xl md:text-4xl">
            {prenom ? `Bonjour ${prenom} 👋` : 'Bienvenue sur ChapExpress'}
            <span className="block mt-1 text-xl font-medium text-white/90 sm:text-2xl">
              Que voulez-vous faire livrer aujourd’hui ?
            </span>
          </h1>
          <p className="text-xs text-white/80 sm:text-sm md:text-base max-w-xl">
            Plats savoureux de vos restaurants favoris, colis urgent ou courses à réaliser en ville : un livreur ChapExpress s'occupe de tout.
          </p>
        </div>

        {/* Halo décoratif en arrière-plan */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-brand-blue/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-12 right-24 size-48 rounded-full bg-[#4aa3ea]/20 blur-2xl" aria-hidden="true" />
      </header>

      {/* Barre de réassurance / Confiance */}
      <div className="grid grid-cols-3 gap-2 py-0.5 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 shadow-2xs">
          <Clock className="size-4 text-brand-blue shrink-0" />
          <span className="text-xs font-semibold text-foreground">30 min estimées</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 shadow-2xs">
          <ShieldCheck className="size-4 text-brand-blue shrink-0" />
          <span className="text-xs font-semibold text-foreground">Mobile Money direct</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 shadow-2xs">
          <Bike className="size-4 text-brand-blue shrink-0" />
          <span className="text-xs font-semibold text-foreground">Suivi en direct</span>
        </div>
      </div>

      {/* Grille de services */}
      <section aria-label="Nos services" className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-5">
        <ServiceTile
          vedette
          className="col-span-2 lg:col-span-3 lg:row-span-2"
          to="/repas"
          badge="🍔 Restaurants & Plats"
          label="Repas"
          description="Les meilleurs plats de vos restaurants partenaires, livrés chauds chez vous."
          action="Découvrir les restaurants"
          slide={REPAS_SLIDE}
        />
        <ServiceTile
          className="lg:col-span-2"
          to="/colis"
          badge="📦 Colis express"
          label="Envoyer un colis"
          description="Un livreur vient récupérer votre colis et le remet en main propre au destinataire."
          action="Envoyer maintenant"
          slide={COLIS_SLIDE}
        />
        <ServiceTile
          className="lg:col-span-2"
          to="/courses-express"
          badge="🛵 En ville"
          label="Faire une course"
          description="Retirer un document, acheter en pharmacie ou déposer un pli : on s'en charge."
          action="Demander une course"
          slide={COURSES_EXPRESS_SLIDE}
        />
        {EMPLETTES_ACTIF && (
          <ServiceTile
            className="col-span-2"
            to="/emplettes"
            badge="🛒 Marché & Courses"
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

      {/* Assistance WhatsApp */}
      <section className="flex flex-col gap-3.5 rounded-3xl bg-gradient-to-r from-secondary to-accent/30 p-5 ring-1 ring-foreground/5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">Besoin d'aide ou commande par téléphone ?</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Notre équipe de dispatch vous répond directement sur WhatsApp 7j/7.</p>
        </div>
        <Button asChild className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shrink-0">
          <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <MessageCircle className="size-4" />
            <span>Assistance WhatsApp</span>
          </a>
        </Button>
      </section>

      <InstallAppPrompt />
    </div>
  );
}
