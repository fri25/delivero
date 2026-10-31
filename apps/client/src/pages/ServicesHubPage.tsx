import { EMPLETTES_ACTIF, ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { Bike, Clock, MessageCircle, Wallet } from 'lucide-react';
import { ActiveOrderBanner } from '@/components/home/ActiveOrderBanner';
import { ActiverNotificationsCard } from '@/components/home/ActiverNotificationsCard';
import { CommandesInviteCard } from '@/components/home/CommandesInviteCard';
import { CommentCaMarche } from '@/components/home/CommentCaMarche';
import { ServiceTile, type TileSlide } from '@/components/home/ServiceTile';
import { EmplettesIllustration } from '@/components/home/illustrations/EmplettesIllustration';
import { RestaurantRail } from '@/components/restaurants/RestaurantRail';
import { Button } from '@/components/ui/button';
import { getPlatImage, getServiceImage } from '@/data/images';
import { InstallAppPrompt } from '@/components/layout/InstallAppPrompt';
import { WHATSAPP_SUPPORT } from '@/lib/support';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useRestaurants } from '@/api/restaurants';

const PHOTO_COLIS = getServiceImage('colis');
const PHOTO_COURSES_EXPRESS = getServiceImage('courses-express');

const SERVICES: { to: string; label: string; description: string; slide: TileSlide; badge?: string }[] = [
  {
    to: '/repas',
    label: 'Repas',
    description: 'Vos restaurants préférés, livrés chauds.',
    slide: { image: getPlatImage('Poisson tilapia braisé') },
    badge: 'Populaire',
  },
  {
    to: '/colis',
    label: 'Colis',
    description: 'Récupéré et remis en main propre.',
    slide: { image: PHOTO_COLIS.square, imageLarge: PHOTO_COLIS.wide },
  },
  {
    to: '/courses-express',
    label: 'Courses express',
    description: 'Pharmacie, document, dépôt en ville.',
    slide: { image: PHOTO_COURSES_EXPRESS.square, imageLarge: PHOTO_COURSES_EXPRESS.wide },
  },
  ...(EMPLETTES_ACTIF
    ? [
        {
          to: '/emplettes',
          label: 'Emplettes',
          description: 'Votre liste, on fait le marché.',
          slide: { illustration: <EmplettesIllustration variant={1} /> },
        },
      ]
    : []),
];

const PROMESSES = [
  { icon: Clock, titre: '~30 min', texte: 'en moyenne en ville' },
  { icon: Wallet, titre: ESPECES_ACTIF ? 'Cash ou MoMo' : 'Mobile Money', texte: 'MTN, Moov, Celtiis' },
  { icon: Bike, titre: 'Suivi en direct', texte: 'du livreur jusqu’à vous' },
];

export function ServicesHubPage() {
  const user = useAuthStore((state) => state.user);
  const prenom = user?.nom.trim().split(/\s+/)[0];
  const { data: restaurants } = useRestaurants();

  const ouverts = (restaurants ?? []).filter((r) => r.statutOuverture).slice(0, 8);
  // Odd count (Emplettes off): Repas takes the full mobile row.
  const repasLarge = SERVICES.length % 2 === 1;

  return (
    <div className="mx-auto max-w-2xl space-y-8 lg:max-w-6xl lg:space-y-10">
      <ActiveOrderBanner />

      <section aria-labelledby="titre-accueil" className="space-y-4 lg:space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {prenom ? `Bonjour ${prenom}` : 'Bienvenue'} · Natitingou
          </p>
          <h1
            id="titre-accueil"
            className="mt-1 font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight text-brand-navy sm:text-4xl dark:text-foreground"
          >
            On vous livre <span className="text-primary">quoi</span> aujourd’hui ?
          </h1>
        </div>

        <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', SERVICES.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {SERVICES.map((service, index) => (
            <ServiceTile
              key={service.to}
              {...service}
              priority={index === 0}
              large={repasLarge && index === 0}
              className={repasLarge && index === 0 ? 'col-span-2 lg:col-span-1' : undefined}
            />
          ))}
        </div>
      </section>

      <ul
        aria-label="Nos engagements"
        className="grid grid-cols-3 divide-x divide-white/20 rounded-3xl bg-primary px-1 py-4 text-primary-foreground sm:py-5"
      >
        {PROMESSES.map(({ icon: Icon, titre, texte }) => (
          <li key={titre} className="flex flex-col items-center gap-1 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <span className="block text-xs font-bold sm:text-sm">{titre}</span>
              <span className="block text-[11px] text-primary-foreground/80 sm:text-xs">{texte}</span>
            </span>
          </li>
        ))}
      </ul>

      <RestaurantRail titre="Ouverts maintenant" restaurants={ouverts} lienTout="/repas" />

      <ActiverNotificationsCard />
      <CommandesInviteCard />

      <CommentCaMarche />

      <section className="flex flex-col gap-4 rounded-3xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
            <MessageCircle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">Besoin d’aide ou commande par téléphone ?</h2>
            <p className="text-sm text-muted-foreground">Notre équipe vous répond sur WhatsApp, 7j/7.</p>
          </div>
        </div>
        <Button asChild className="h-11 shrink-0 rounded-full px-5 font-semibold">
          <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer">
            Écrire sur WhatsApp
          </a>
        </Button>
      </section>

      <InstallAppPrompt />
    </div>
  );
}
