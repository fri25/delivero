import { EMPLETTES_ACTIF, ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { Search, ShoppingBasket } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActiveOrderBanner } from '@/components/home/ActiveOrderBanner';
import { ActiverNotificationsCard } from '@/components/home/ActiverNotificationsCard';
import { CommandesInviteCard } from '@/components/home/CommandesInviteCard';
import { ServiceTuile } from '@/components/home/ServiceTuile';
import { RestaurantRail } from '@/components/restaurants/RestaurantRail';
import { InstallAppPrompt } from '@/components/layout/InstallAppPrompt';
import { QuartierSelectorDialog } from '@/components/layout/QuartierSelectorDialog';
import { getPlatImage, getServiceImage } from '@/data/images';
import { cn } from '@/lib/utils';
import { useRestaurants } from '@/api/restaurants';
import { useEntreprise } from '@/lib/entreprise';
import { useLienSupport } from '@/lib/support';
import { codeService, estOuvert } from '@delivero/config/entreprise';

const PHOTO_REPAS = getServiceImage('repas');
const PHOTO_COLIS = getServiceImage('colis');
const PHOTO_COURSES_EXPRESS = getServiceImage('courses-express');

const SERVICES = [
  // The hero already shows the grilled fish: the Repas tile takes another dish.
  { to: '/repas', label: 'Repas', description: 'Les restaurants de la ville', image: getPlatImage('Riz gras') },
  { to: '/colis', label: 'Colis', description: 'Remis en main propre', image: PHOTO_COLIS.square },
  {
    to: '/courses-express',
    label: 'Courses express',
    description: 'Pharmacie, document, dépôt',
    image: PHOTO_COURSES_EXPRESS.square,
  },
  ...(EMPLETTES_ACTIF
    ? [
        {
          to: '/emplettes',
          label: 'Emplettes',
          description: 'On fait le marché pour vous',
          illustration: <ShoppingBasket className="size-10" strokeWidth={1.5} aria-hidden="true" />,
        },
      ]
    : []),
];

const REPERES = ['~30 min en ville', ESPECES_ACTIF ? 'Espèces ou Mobile Money' : 'Mobile Money', 'Prix fixe par quartier'];

export function ServicesHubPage() {
  const entreprise = useEntreprise();
  const lienSupport = useLienSupport();
  // Services the company opens (étape 6), within the compile-time ceiling.
  const services = SERVICES.filter((service) => estOuvert(entreprise, codeService(service.to)));
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const { data: restaurants } = useRestaurants();
  const ouverts = (restaurants ?? []).filter((r) => r.statutOuverture).slice(0, 8);

  const chercher = (event: FormEvent) => {
    event.preventDefault();
    const q = recherche.trim();
    navigate(q ? `/repas?q=${encodeURIComponent(q)}` : '/repas');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7 lg:max-w-6xl lg:space-y-10">
      <section
        aria-labelledby="titre-accueil"
        className="-mx-4 -mt-5 overflow-hidden bg-primary text-primary-foreground md:mx-0 md:mt-0 md:rounded-3xl lg:grid lg:grid-cols-[1fr_420px]"
      >
        <div className="px-4 pt-4 pb-6 md:p-8 lg:p-10">
          <QuartierSelectorDialog variante="hero" className="-ml-1" />
          <h1 id="titre-accueil" className="mt-4 font-heading text-[28px] leading-[1.1] font-extrabold tracking-tight lg:text-[44px]">
            Livré chez vous,
            <br />
            partout à {entreprise.ville}
          </h1>

          <form role="search" onSubmit={chercher} className="mt-5 flex h-13 items-center gap-2 rounded-2xl bg-white pr-1.5 pl-4 text-foreground lg:max-w-lg">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="recherche-accueil" className="sr-only">
              Rechercher un restaurant ou un plat
            </label>
            <input
              id="recherche-accueil"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Un plat, un restaurant…"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="h-10 shrink-0 cursor-pointer rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
              Chercher
            </button>
          </form>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
            {REPERES.map((repere) => (
              <li key={repere} className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-white/70" aria-hidden="true" />
                {repere}
              </li>
            ))}
          </ul>
        </div>

        {PHOTO_REPAS.wide && (
          <img
            src={PHOTO_REPAS.wide.src}
            srcSet={PHOTO_REPAS.wide.srcSet}
            sizes="420px"
            alt=""
            fetchPriority="high"
            className="hidden h-full w-full object-cover lg:block"
          />
        )}
      </section>

      <ActiveOrderBanner />

      <section aria-label="Nos services">
        <div className={cn('grid gap-3 lg:gap-4', services.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : services.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {services.map((service, index) => (
            <ServiceTuile key={service.to} {...service} priority={index === 0} />
          ))}
        </div>
      </section>

      <RestaurantRail titre="Ouverts maintenant" restaurants={ouverts} lienTout="/repas" />

      <ActiverNotificationsCard />
      <CommandesInviteCard />

      <section className="carte flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-bold">Commander par téléphone ou poser une question</h2>
          <p className="text-sm text-muted-foreground">L’équipe {entreprise.nomCommercial} répond sur WhatsApp, 7 jours sur 7.</p>
        </div>
        <a
          href={lienSupport}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#1f9d55] px-5 text-sm font-bold text-white hover:bg-[#1a8a4a]"
        >
          Écrire sur WhatsApp
        </a>
      </section>

      <InstallAppPrompt />
    </div>
  );
}
