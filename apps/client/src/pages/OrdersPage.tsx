import { useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterChip } from '@/components/restaurants/FilterChip';
import { LigneCommande } from '@/components/orders/LigneCommande';
import { useHistoriqueCommandes, type CommandeResume, type IssueCommande } from '@/api/historique';
import type { TypeService } from '@/api/types';
import { modeleColis, modeleCoursesExpress, useRecommanderRepas } from '@/lib/recommander';

type Periode = 'tout' | '30' | '90';

const ISSUES: { value: 'tout' | IssueCommande; label: string }[] = [
  { value: 'tout', label: 'Toutes' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminées' },
  { value: 'annulee', label: 'Annulées' },
];

const SERVICES: { value: 'tous' | TypeService; label: string }[] = [
  { value: 'tous', label: 'Tous services' },
  { value: 'repas', label: 'Repas' },
  { value: 'colis', label: 'Colis' },
  { value: 'courses_express', label: 'Courses' },
];

const JOUR_MS = 24 * 60 * 60 * 1000;

/** F-CLI-06: every order of every service, open ones first. */
export function OrdersPage() {
  const { commandes, isPending, isError, refetch } = useHistoriqueCommandes();
  const { recommander, enCours: recommandationEnCours } = useRecommanderRepas();
  const [issue, setIssue] = useState<'tout' | IssueCommande>('tout');
  const [service, setService] = useState<'tous' | TypeService>('tous');
  const [periode, setPeriode] = useState<Periode>('tout');
  // Reference time for the period filter, fixed for the page's lifetime.
  const [maintenant] = useState(() => Date.now());

  const filtrees = useMemo(() => {
    const limite = periode === 'tout' ? 0 : maintenant - Number(periode) * JOUR_MS;
    return commandes.filter(
      (c) =>
        (issue === 'tout' || c.issue === issue) &&
        (service === 'tous' || c.typeService === service) &&
        Date.parse(c.createdAt) >= limite,
    );
  }, [commandes, issue, service, periode, maintenant]);

  const enCours = filtrees.filter((c) => c.issue === 'en_cours');
  const passees = filtrees.filter((c) => c.issue !== 'en_cours');
  const nbEnCours = commandes.filter((c) => c.issue === 'en_cours').length;
  const filtresActifs = issue !== 'tout' || service !== 'tous' || periode !== 'tout';

  const refaire = (c: CommandeResume) => {
    if (c.issue !== 'terminee') return undefined;
    if (c.repas) {
      const repas = c.repas;
      return { libelle: 'Recommander', onClick: () => void recommander(repas), enCours: recommandationEnCours };
    }
    if (c.colis) return { libelle: 'Envoyer un colis similaire', to: '/colis', state: { modele: modeleColis(c.colis) } };
    if (c.coursesExpress) {
      return { libelle: 'Refaire cette course', to: '/courses-express', state: { modele: modeleCoursesExpress(c.coursesExpress) } };
    }
    return undefined;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold whitespace-nowrap lg:text-3xl text-foreground">Mes commandes</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {commandes.length} commande{commandes.length > 1 ? 's' : ''}
            {nbEnCours > 0 ? ` · ${nbEnCours} en cours` : ''}
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Période</span>
          <select
            value={periode}
            onChange={(event) => setPeriode(event.target.value as Periode)}
            className="h-9.5 rounded-full border border-border/80 bg-card px-3.5 text-xs font-semibold shadow-2xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
          >
            <option value="tout">Depuis le début</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
        </label>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]" aria-label="Filtres">
        {ISSUES.map((option) => (
          <FilterChip key={option.value} actif={issue === option.value} onClick={() => setIssue(option.value)}>
            {option.label}
          </FilterChip>
        ))}
        <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden="true" />
        {SERVICES.map((option) => (
          <FilterChip key={option.value} actif={service === option.value} onClick={() => setService(option.value)}>
            {option.label}
          </FilterChip>
        ))}
      </div>

      {isError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-destructive/10 p-4 border border-destructive/20 text-destructive">
          <p className="text-xs sm:text-sm font-medium">Une partie de votre historique n’a pas pu être chargée.</p>
          <Button variant="outline" size="sm" onClick={refetch} className="rounded-xl">
            <RefreshCw className="size-3.5" /> Réessayer
          </Button>
        </div>
      )}

      {isPending && commandes.length === 0 && (
        <div className="space-y-3" aria-label="Chargement des commandes">
          <Skeleton className="h-22 w-full rounded-3xl" />
          <Skeleton className="h-22 w-full rounded-3xl" />
          <Skeleton className="h-22 w-full rounded-3xl" />
        </div>
      )}

      {!isPending && filtrees.length === 0 && (
        <div className="rounded-3xl bg-card px-6 py-12 text-center border border-border/70 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
            <CalendarDays className="size-7" aria-hidden="true" />
          </div>
          <h2 className="font-heading mt-4 text-lg font-bold text-foreground">
            {commandes.length ? 'Aucune commande pour ces filtres' : 'Pas encore de commande'}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {commandes.length
              ? 'Modifiez les filtres pour retrouver une commande.'
              : 'Vos repas, colis et courses apparaîtront ici, avec leur suivi en direct.'}
          </p>
          {filtresActifs ? (
            <Button
              variant="outline"
              className="mt-5 rounded-xl font-semibold shadow-xs"
              onClick={() => {
                setIssue('tout');
                setService('tous');
                setPeriode('tout');
              }}
            >
              Effacer les filtres
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-5 rounded-xl font-semibold shadow-md shadow-primary/20">
              <Link to="/">Passer une commande</Link>
            </Button>
          )}
        </div>
      )}

      {enCours.length > 0 && (
        <section className="space-y-3" aria-labelledby="titre-en-cours">
          <h2 id="titre-en-cours" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            En cours
          </h2>
          <ul className="space-y-3">
            {enCours.map((c) => (
              <LigneCommande key={`${c.typeService}:${c.id}`} commande={c} />
            ))}
          </ul>
        </section>
      )}

      {passees.length > 0 && (
        <section className="space-y-2.5" aria-labelledby="titre-passees">
          <h2 id="titre-passees" className="font-heading text-base font-semibold">
            {enCours.length > 0 ? 'Historique' : 'Vos commandes'}
          </h2>
          <ul className="space-y-2.5">
            {passees.map((c) => (
              <LigneCommande key={`${c.typeService}:${c.id}`} commande={c} refaire={refaire(c)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
