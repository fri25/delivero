import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, Package, RefreshCw, Utensils, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMesCommandes } from '@/api/commandes-repas';
import { useMesCommandesColis } from '@/api/commandes-colis';
import { useMesCommandesCoursesExpress } from '@/api/commandes-courses-express';
import { useCartStore } from '@/stores/cart-store';
import { formatPrixFcfa } from '@/lib/format';
import { STATUT_REPAS_LABELS } from '@/lib/statut-repas';
import { STATUT_COLIS_LABELS } from '@/lib/statut-colis';
import { STATUT_COURSES_EXPRESS_LABELS } from '@/lib/statut-courses-express';
import type { CommandeColis, CommandeCoursesExpress, CommandeRepas } from '@/api/types';

type Service = 'repas' | 'colis' | 'courses_express';
type Periode = 'tout' | '30' | '90';
type StatutFiltre = 'tout' | 'en_cours' | 'terminee' | 'annulee';

interface HistoriqueItem {
  id: string;
  service: Service;
  titre: string;
  statut: string;
  statutLabel: string;
  date: string;
  montant: string | null;
  href: string;
  commandeRepas?: CommandeRepas;
  commandeColis?: CommandeColis;
  commandeCoursesExpress?: CommandeCoursesExpress;
  estTerminee: boolean;
  estAnnulee: boolean;
}

const SERVICE_LABELS: Record<Service, string> = {
  repas: 'Repas',
  colis: 'Colis',
  courses_express: 'Courses express',
};

const TERMINAUX: Record<Service, string[]> = {
  repas: ['livree', 'annulee', 'refusee'],
  colis: ['livre', 'annulee', 'litige'],
  courses_express: ['terminee', 'annulee', 'litige'],
};

function versRepas(commande: CommandeRepas): HistoriqueItem {
  return {
    id: commande.id,
    service: 'repas',
    titre: commande.partenaire.nom,
    statut: commande.statut,
    statutLabel: STATUT_REPAS_LABELS[commande.statut] ?? 'Statut inconnu',
    date: commande.createdAt,
    montant: commande.commande.montantTotal,
    href: `/commandes/${commande.id}`,
    commandeRepas: commande,
    estTerminee: commande.statut === 'livree',
    estAnnulee: commande.statut === 'annulee' || commande.statut === 'refusee',
  };
}

function versColis(commande: CommandeColis): HistoriqueItem {
  return {
    id: commande.id,
    service: 'colis',
    titre: `Envoi à ${commande.destinataireNom}`,
    statut: commande.statut,
    statutLabel: STATUT_COLIS_LABELS[commande.statut] ?? 'Statut inconnu',
    date: commande.createdAt,
    montant: commande.commande.montantTotal,
    href: `/colis/commandes/${commande.id}`,
    commandeColis: commande,
    estTerminee: commande.statut === 'livre',
    estAnnulee: commande.statut === 'annulee' || commande.statut === 'litige',
  };
}

function versCoursesExpress(commande: CommandeCoursesExpress): HistoriqueItem {
  return {
    id: commande.id,
    service: 'courses_express',
    titre: commande.description,
    statut: commande.statut,
    statutLabel: STATUT_COURSES_EXPRESS_LABELS[commande.statut] ?? 'Statut inconnu',
    date: commande.createdAt,
    montant: commande.commande.montantTotal,
    href: `/courses-express/commandes/${commande.id}`,
    commandeCoursesExpress: commande,
    estTerminee: commande.statut === 'terminee',
    estAnnulee: commande.statut === 'annulee' || commande.statut === 'litige',
  };
}

function dateBenin(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(new Date(value));
}

function IconeService({ service }: { service: Service }) {
  const Icon = service === 'repas' ? Utensils : service === 'colis' ? Package : Zap;
  return <Icon className="size-4" aria-hidden="true" />;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const repas = useMesCommandes();
  const colis = useMesCommandesColis();
  const express = useMesCommandesCoursesExpress();
  const cart = useCartStore();
  const [service, setService] = useState<'tous' | Service>('tous');
  const [periode, setPeriode] = useState<Periode>('tout');
  const [statut, setStatut] = useState<StatutFiltre>('tout');

  const items = useMemo(() => {
    const values: HistoriqueItem[] = [];
    if (repas.data) values.push(...repas.data.map(versRepas));
    if (colis.data) values.push(...colis.data.map(versColis));
    if (express.data) values.push(...express.data.map(versCoursesExpress));
    return values.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [repas.data, colis.data, express.data]);

  const filtered = useMemo(() => {
    const cutoff = periode === 'tout' ? 0 : Date.now() - Number(periode) * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      if (service !== 'tous' && item.service !== service) return false;
      if (cutoff && Date.parse(item.date) < cutoff) return false;
      if (statut === 'en_cours' && (item.estTerminee || item.estAnnulee || TERMINAUX[item.service].includes(item.statut))) return false;
      if (statut === 'terminee' && !item.estTerminee) return false;
      if (statut === 'annulee' && !item.estAnnulee) return false;
      return true;
    });
  }, [items, periode, service, statut]);

  const isPending = repas.isPending || colis.isPending || express.isPending;
  const hasError = repas.isError || colis.isError || express.isError;
  const retry = () => {
    void Promise.all([repas.refetch(), colis.refetch(), express.refetch()]);
  };
  const enCours = items.filter((item) => !item.estTerminee && !item.estAnnulee && !TERMINAUX[item.service].includes(item.statut)).length;

  const recommander = (commande: CommandeRepas) => {
    if (cart.items.length > 0) {
      const remplacer = window.confirm('Votre panier contient déjà des articles. Le remplacer par cette ancienne commande ?');
      if (!remplacer) return;
    }
    cart.clear();
    for (const ligne of commande.lignes) {
      cart.addItem(commande.partenaire.id, commande.partenaire.nom, {
        platId: ligne.platId,
        nom: ligne.plat.nom,
        prixUnitaire: Number(ligne.prixUnitaire),
        quantite: ligne.quantite,
        instructions: ligne.instructions ?? undefined,
      });
    }
    navigate('/panier');
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-blue p-5 text-white shadow-lg sm:p-7">
        <div className="absolute -right-12 -top-16 size-48 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Votre espace</p>
            <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">Mes commandes</h1>
            <p className="mt-2 max-w-md text-sm text-white/75">Retrouvez vos livraisons et leur suivi au même endroit.</p>
          </div>
          <div className="hidden size-12 items-center justify-center rounded-2xl bg-white/10 sm:flex">
            <Package className="size-6" aria-hidden="true" />
          </div>
        </div>
        <div className="relative mt-5 flex gap-3 text-sm">
          <div className="rounded-xl bg-white/10 px-3 py-2"><span className="font-semibold">{items.length}</span><span className="ml-1.5 text-white/75">commande{items.length > 1 ? 's' : ''}</span></div>
          <div className="rounded-xl bg-white/10 px-3 py-2"><span className="font-semibold">{enCours}</span><span className="ml-1.5 text-white/75">en cours</span></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-3 sm:p-4" aria-label="Filtres de l’historique">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Service
          <select value={service} onChange={(event) => setService(event.target.value as 'tous' | Service)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="tous">Tous les services</option><option value="repas">Repas</option><option value="colis">Colis</option><option value="courses_express">Courses express</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Statut
          <select value={statut} onChange={(event) => setStatut(event.target.value as StatutFiltre)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="tout">Tous les statuts</option><option value="en_cours">En cours</option><option value="terminee">Terminées</option><option value="annulee">Annulées / incidents</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Période
          <select value={periode} onChange={(event) => setPeriode(event.target.value as Periode)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="tout">Depuis le début</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option>
          </select>
        </label>
      </section>

      {hasError && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">Une partie de votre historique n’a pas pu être chargée. Vos autres commandes restent affichées.</p>
          <Button variant="outline" size="sm" onClick={retry}><RefreshCw className="size-4" /> Réessayer</Button>
        </div>
      )}

      {isPending && items.length === 0 && <div className="space-y-3" aria-label="Chargement des commandes"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>}

      {!isPending && !hasError && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><CalendarDays className="size-6" /></div>
          <h2 className="mt-4 font-heading text-lg font-semibold">{items.length ? 'Aucune commande pour ces filtres' : 'Votre historique commence ici'}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{items.length ? 'Modifiez les filtres pour retrouver une commande.' : 'Passez votre première commande et vous pourrez suivre toutes vos livraisons ici.'}</p>
          {items.length ? <Button variant="outline" className="mt-4" onClick={() => { setService('tous'); setStatut('tout'); setPeriode('tout'); }}>Effacer les filtres</Button> : <Button asChild className="mt-4"><Link to="/">Découvrir les services</Link></Button>}
        </div>
      )}

      {filtered.length > 0 && (
        <section className="space-y-3" aria-label="Liste des commandes">
          <div className="flex items-center justify-between px-1"><h2 className="font-heading text-base font-semibold">Historique</h2><span className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span></div>
          {filtered.map((item) => (
            <article key={`${item.service}:${item.id}`} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><IconeService service={item.service} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5"><IconeService service={item.service} />{SERVICE_LABELS[item.service]}</Badge>
                    <Badge variant="outline" className="rounded-full">{item.statutLabel}</Badge>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-semibold leading-snug">{item.titre}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{dateBenin(item.date)}</span>
                    {item.montant && <span className="font-semibold text-foreground">{formatPrixFcfa(item.montant)}</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm"><Link to={item.href}>Voir le suivi <ArrowRight className="size-4" /></Link></Button>
                    {item.service === 'repas' && item.estTerminee && item.commandeRepas && <Button size="sm" variant="outline" onClick={() => recommander(item.commandeRepas!)}><RefreshCw className="size-4" /> Recommander</Button>}
                    {item.service === 'colis' && item.estTerminee && item.commandeColis && <Button asChild size="sm" variant="outline"><Link to="/colis" state={{ preRemplir: {
                      adresseEnlevementId: item.commandeColis.adresseEnlevement.id,
                      zoneId: item.commandeColis.zone.id,
                      taille: item.commandeColis.taille,
                      destinataireNom: item.commandeColis.destinataireNom,
                      destinataireTelephone: item.commandeColis.destinataireTelephone,
                      adresseLivraison: item.commandeColis.adresseLivraison,
                      pointDeRepereLivraison: item.commandeColis.pointDeRepereLivraison,
                      valeurDeclaree: item.commandeColis.valeurDeclaree,
                      fragile: item.commandeColis.fragile,
                    } }}><RefreshCw className="size-4" /> Refaire la demande</Link></Button>}
                    {item.service === 'courses_express' && item.estTerminee && item.commandeCoursesExpress && <Button asChild size="sm" variant="outline"><Link to="/courses-express" state={{ preRemplir: {
                      description: item.commandeCoursesExpress.description,
                      zoneId: item.commandeCoursesExpress.zone.id,
                      etapes: item.commandeCoursesExpress.etapes.map(({ description, pointDeRepere, adresse }) => ({ description, pointDeRepere, adresse: adresse ?? '' })),
                    } }}><RefreshCw className="size-4" /> Refaire la demande</Link></Button>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
