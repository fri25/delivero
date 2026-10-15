import {
  CONTRE_REMBOURSEMENT_ACTIF,
  EMPLETTES_ACTIF,
  ESPECES_ACTIF,
} from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import {
  PhoneCall,
  User,
  Phone,
  MapPin,
  Utensils,
  Package,
  ShoppingBag,
  Zap,
  Plus,
  Trash2,
  Info,
  Loader2,
  Navigation as NavIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useSaisieManuelleColis,
  useSaisieManuelleCoursesExpress,
  useSaisieManuelleEmplettes,
  useSaisieManuelleRepas,
} from '@/api/saisie-manuelle';
import { useRestaurant, useRestaurants } from '@/api/restaurants';
import { QuartierSelect } from '@/components/saisie/QuartierSelect';
import { ZoneSelect } from '@/components/zones/ZoneSelect';
import { cn } from '@/lib/utils';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement, TypeService } from '@/api/types';

interface ServiceOption {
  value: TypeService;
  label: string;
  icone: typeof Utensils;
  description: string;
}

const TOUS_SERVICES: ServiceOption[] = [
  { value: 'repas', label: 'Repas', icone: Utensils, description: 'Commande restaurant' },
  { value: 'colis', label: 'Colis', icone: Package, description: 'Livraison de colis' },
  { value: 'emplettes', label: 'Emplettes', icone: ShoppingBag, description: 'Courses sur liste libre' },
  { value: 'courses_express', label: 'Courses express', icone: Zap, description: 'Courses multi-arrêts' },
];

const SERVICES = TOUS_SERVICES.filter((s) => s.value !== 'emplettes' || EMPLETTES_ACTIF);

const MODE_PAIEMENT_V1: ModePaiement = ESPECES_ACTIF ? 'especes' : 'mobile_money';

const MESSAGE_CREATION = (service: string) =>
  MODE_PAIEMENT_V1 === 'mobile_money'
    ? `Commande ${service} créée. Confirmez le paiement depuis « Commandes » dès réception du Mobile Money.`
    : `Commande ${service} créée.`;

const ETAPE_VIDE = { description: '', pointDeRepere: '', quartierId: '', precision: '' };

function ClientFields({
  clientNom,
  setClientNom,
  clientTelephone,
  setClientTelephone,
}: {
  clientNom: string;
  setClientNom: (v: string) => void;
  clientTelephone: string;
  setClientTelephone: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <User className="size-4 text-primary" />
        <span>1. Coordonnées de l'appelant</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-nom" className="text-xs font-semibold">
            Nom et prénom de l'appelant *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="client-nom"
              className="pl-9 rounded-xl"
              placeholder="Ex. Biobio Pascal"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-telephone" className="text-xs font-semibold">
            Numéro de téléphone *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="client-telephone"
              className="pl-9 rounded-xl font-mono"
              value={clientTelephone}
              onChange={(e) => setClientTelephone(e.target.value)}
              placeholder="+22901000000"
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Le compte client est automatiquement retrouvé ou créé avec ce numéro.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormRepas() {
  const saisir = useSaisieManuelleRepas();
  const { data: restaurants } = useRestaurants();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const [quartier, setQuartier] = useState({ quartierId: '', precision: '' });
  const [partenaireId, setPartenaireId] = useState('');
  const { data: restaurant } = useRestaurant(partenaireId || undefined);
  const [lignes, setLignes] = useState([{ platId: '', quantite: 1 }]);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setPointDeRepere('');
    setQuartier({ quartierId: '', precision: '' });
    setPartenaireId('');
    setLignes([{ platId: '', quantite: 1 }]);
  };

  const totalPlats = lignes.reduce((acc, ligne) => {
    const plat = restaurant?.plats.find((p) => p.id === ligne.platId);
    return acc + (plat ? Number(plat.prix) * (ligne.quantite || 1) : 0);
  }, 0);

  return (
    <form
      className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepere,
            quartierId: quartier.quartierId,
            quartier: quartier.precision.trim() || undefined,
            partenaireId,
            modePaiement: MODE_PAIEMENT_V1,
            lignes: lignes.filter((l) => l.platId),
          },
          {
            onSuccess: () => {
              toast.success(MESSAGE_CREATION('Repas'));
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />

      {/* Restaurant Selection */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Utensils className="size-4 text-primary" />
          <span>2. Choix du restaurant & des plats</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="repas-restaurant" className="text-xs font-semibold">
            Restaurant partenaire *
          </Label>
          <select
            id="repas-restaurant"
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-xs cursor-pointer"
            value={partenaireId}
            onChange={(e) => {
              setPartenaireId(e.target.value);
              setLignes([{ platId: '', quantite: 1 }]);
            }}
            required
          >
            <option value="" disabled>
              Sélectionnez un restaurant
            </option>
            {restaurants?.map((resto) => (
              <option key={resto.id} value={resto.id}>
                {resto.nom}
              </option>
            ))}
          </select>
        </div>

        {partenaireId && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Articles commandés</Label>
              {totalPlats > 0 && (
                <span className="text-xs font-bold text-primary font-mono">
                  Sous-total : {formatPrixFcfa(totalPlats)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {lignes.map((ligne, index) => {
                const platChoisi = restaurant?.plats.find((p) => p.id === ligne.platId);
                return (
                  <div
                    key={index}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-border/60 bg-card p-2.5 shadow-xs"
                  >
                    <select
                      className="h-9 flex-1 min-w-[200px] rounded-lg border border-input bg-background/50 px-2.5 text-sm font-medium outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
                      value={ligne.platId}
                      onChange={(e) => {
                        const platId = e.target.value;
                        setLignes(lignes.map((l, i) => (i === index ? { ...l, platId } : l)));
                      }}
                      disabled={!restaurant}
                      required
                    >
                      <option value="" disabled>
                        Choisir un plat du menu
                      </option>
                      {restaurant?.plats.map((plat) => (
                        <option key={plat.id} value={plat.id}>
                          {plat.nom} — {formatPrixFcfa(plat.prix)}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Qté :</span>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          className="h-9 w-16 text-center font-mono font-bold rounded-lg"
                          value={ligne.quantite}
                          onChange={(e) => {
                            const quantite = Math.max(1, Number(e.target.value));
                            setLignes(lignes.map((l, i) => (i === index ? { ...l, quantite } : l)));
                          }}
                        />
                      </div>

                      {platChoisi && (
                        <span className="text-xs font-mono font-semibold text-muted-foreground w-20 text-right">
                          {formatPrixFcfa(Number(platChoisi.prix) * (ligne.quantite || 1))}
                        </span>
                      )}

                      {lignes.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() => setLignes(lignes.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Retirer</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl border-dashed font-medium text-xs gap-1.5"
              onClick={() => setLignes([...lignes, { platId: '', quantite: 1 }])}
            >
              <Plus className="size-3.5" />
              Ajouter un autre plat
            </Button>
          </div>
        )}
      </div>

      {/* Delivery Destination */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          <span>3. Lieu de livraison client</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="repas-quartier" className="text-xs font-semibold">
              Quartier de livraison (fixe les frais) *
            </Label>
            <QuartierSelect
              id="repas-quartier"
              quartierId={quartier.quartierId}
              precision={quartier.precision}
              onChange={setQuartier}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repas-point-de-repere" className="text-xs font-semibold">
              Point de repère précis *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="repas-point-de-repere"
                className="pl-9 rounded-xl"
                placeholder="Ex. Face pharmacie Kaba, portail bleu"
                value={pointDeRepere}
                onChange={(e) => setPointDeRepere(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-md gap-2"
          disabled={saisir.isPending}
        >
          {saisir.isPending ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
          Enregistrer la commande Repas
        </Button>
      </div>
    </form>
  );
}

const SUGGESTIONS_NATURE = [
  'Plis / Documents',
  'Vêtements / Textile',
  'Nourriture / Repas',
  'Électronique / High-Tech',
  'Cosmétique / Santé',
];

function FormColis() {
  const saisir = useSaisieManuelleColis();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepereEnlevement, setPointDeRepereEnlevement] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [taille, setTaille] = useState<'petit' | 'moyen' | 'grand'>('petit');
  const [nature, setNature] = useState('');
  const [destinataireNom, setDestinataireNom] = useState('');
  const [destinataireTelephone, setDestinataireTelephone] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [quartierLivraison, setQuartierLivraison] = useState({ quartierId: '', precision: '' });
  const [pointDeRepereLivraison, setPointDeRepereLivraison] = useState('');
  const [montantContreRemboursement, setMontantContreRemboursement] = useState('');

  return (
    <form
      className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepereEnlevement,
            zoneId,
            taille,
            nature: nature.trim() || undefined,
            destinataireNom,
            destinataireTelephone,
            adresseLivraison: adresseLivraison.trim() || undefined,
            quartierLivraisonId: quartierLivraison.quartierId,
            quartierLivraison: quartierLivraison.precision.trim() || undefined,
            pointDeRepereLivraison,
            montantContreRemboursement: montantContreRemboursement
              ? Number(montantContreRemboursement)
              : undefined,
            modePaiement: MODE_PAIEMENT_V1,
            conditionsAcceptees: true,
          },
          {
            onSuccess: () => {
              toast.success(MESSAGE_CREATION('Colis'));
              setClientNom('');
              setClientTelephone('');
              setPointDeRepereEnlevement('');
              setZoneId('');
              setNature('');
              setDestinataireNom('');
              setDestinataireTelephone('');
              setAdresseLivraison('');
              setQuartierLivraison({ quartierId: '', precision: '' });
              setPointDeRepereLivraison('');
              setMontantContreRemboursement('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />

      {/* Retrait / Expédition */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <NavIcon className="size-4 text-primary" />
          <span>2. Retrait du colis (Expéditeur)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="colis-zone" className="text-xs font-semibold">
              Zone opérationnelle *
            </Label>
            <ZoneSelect id="colis-zone" value={zoneId} onChange={setZoneId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colis-enlevement" className="text-xs font-semibold">
              Point de repère d’enlèvement *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="colis-enlevement"
                className="pl-9 rounded-xl"
                placeholder="Ex. Devant la Poste centrale"
                value={pointDeRepereEnlevement}
                onChange={(e) => setPointDeRepereEnlevement(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Caractéristiques du Colis */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Package className="size-4 text-primary" />
          <span>3. Détails & Gabarit du colis</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">Taille / Gabarit du colis</Label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { val: 'petit', label: 'Petit', desc: 'Enveloppe, clés, document' },
                { val: 'moyen', label: 'Moyen', desc: 'Boîte à chaussures, sac' },
                { val: 'grand', label: 'Grand', desc: 'Carton volumineux' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setTaille(opt.val as 'petit' | 'moyen' | 'grand')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    taille === opt.val
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border/60 bg-card hover:bg-muted/50 text-foreground',
                  )}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground font-normal line-clamp-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="colis-nature" className="text-xs font-semibold">
              Nature ou contenu <span className="font-normal text-muted-foreground">(recommandé pour l'assurance)</span>
            </Label>
            <Input
              id="colis-nature"
              className="rounded-xl"
              placeholder="Ex : Documents administratifs, vêtements..."
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              maxLength={120}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS_NATURE.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNature(sug)}
                  className="rounded-lg border border-border/60 bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {CONTRE_REMBOURSEMENT_ACTIF && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="colis-cr" className="text-xs font-semibold">
                Contre-remboursement (FCFA, optionnel)
              </Label>
              <Input
                id="colis-cr"
                type="number"
                min="0"
                className="rounded-xl font-mono"
                placeholder="Montant à encaisser auprès du destinataire"
                value={montantContreRemboursement}
                onChange={(e) => setMontantContreRemboursement(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Destinataire */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <User className="size-4 text-primary" />
          <span>4. Coordonnées & Lieu du destinataire</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="colis-dest-nom" className="text-xs font-semibold">
              Nom du destinataire *
            </Label>
            <Input
              id="colis-dest-nom"
              className="rounded-xl"
              placeholder="Nom du récepteur"
              value={destinataireNom}
              onChange={(e) => setDestinataireNom(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colis-dest-tel" className="text-xs font-semibold">
              Téléphone du destinataire *
            </Label>
            <Input
              id="colis-dest-tel"
              className="rounded-xl font-mono"
              placeholder="+22901000000"
              value={destinataireTelephone}
              onChange={(e) => setDestinataireTelephone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colis-quartier-livraison" className="text-xs font-semibold">
              Quartier du destinataire (fixe le prix) *
            </Label>
            <QuartierSelect
              id="colis-quartier-livraison"
              quartierId={quartierLivraison.quartierId}
              precision={quartierLivraison.precision}
              onChange={setQuartierLivraison}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colis-point-livraison" className="text-xs font-semibold">
              Point de repère livraison *
            </Label>
            <Input
              id="colis-point-livraison"
              className="rounded-xl"
              placeholder="Ex. À côté du commissariat central"
              value={pointDeRepereLivraison}
              onChange={(e) => setPointDeRepereLivraison(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="colis-adresse-livraison" className="text-xs font-semibold">
              Rue, concession, maison <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Input
              id="colis-adresse-livraison"
              className="rounded-xl"
              placeholder="Informations complémentaires pour le coursier"
              value={adresseLivraison}
              onChange={(e) => setAdresseLivraison(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <p>
          Rappel réglementaire (RG-16) : l'opérateur doit s'assurer verbalement auprès de l'appelant qu'aucun produit
          interdit, illicite ou dangereux n'est transporté avant validation.
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-md gap-2"
          disabled={saisir.isPending}
        >
          {saisir.isPending ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
          Enregistrer la commande Colis
        </Button>
      </div>
    </form>
  );
}

function FormEmplettes() {
  const saisir = useSaisieManuelleEmplettes();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [articles, setArticles] = useState(['']);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setPointDeRepere('');
    setZoneId('');
    setBudgetMax('');
    setArticles(['']);
  };

  return (
    <form
      className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepere,
            mode: 'liste_libre',
            zoneId,
            budgetMax: Number(budgetMax),
            modeFinancement: 'especes_livraison',
            articles: articles.filter((a) => a.trim()).map((libelle) => ({ libelle })),
          },
          {
            onSuccess: () => {
              toast.success('Commande Emplettes créée.');
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          <span>2. Lieu de livraison & Budget</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="emplettes-zone" className="text-xs font-semibold">
              Zone opérationnelle *
            </Label>
            <ZoneSelect id="emplettes-zone" value={zoneId} onChange={setZoneId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emplettes-budget" className="text-xs font-semibold">
              Budget maximum alloué (FCFA) *
            </Label>
            <Input
              id="emplettes-budget"
              type="number"
              min="0"
              className="rounded-xl font-mono font-bold"
              placeholder="Ex. 10000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="emplettes-point-de-repere" className="text-xs font-semibold">
              Point de repère livraison *
            </Label>
            <Input
              id="emplettes-point-de-repere"
              className="rounded-xl"
              value={pointDeRepere}
              onChange={(e) => setPointDeRepere(e.target.value)}
              placeholder="Ex. À côté de l'école primaire"
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ShoppingBag className="size-4 text-primary" />
          <span>3. Liste de courses demandées</span>
        </div>
        <div className="space-y-2.5">
          {articles.map((article, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={article}
                className="rounded-xl flex-1"
                onChange={(e) => {
                  const next = [...articles];
                  next[index] = e.target.value;
                  setArticles(next);
                }}
                placeholder="Ex. 2 sachets de spaghettis, 1 bidon d'huile 1L..."
                required
              />
              {articles.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => setArticles(articles.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl border-dashed font-medium text-xs gap-1.5"
            onClick={() => setArticles([...articles, ''])}
          >
            <Plus className="size-3.5" />
            Ajouter un article à la liste
          </Button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-md gap-2"
          disabled={saisir.isPending}
        >
          {saisir.isPending ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
          Enregistrer la commande Emplettes
        </Button>
      </div>
    </form>
  );
}

function FormCoursesExpress() {
  const saisir = useSaisieManuelleCoursesExpress();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [etapes, setEtapes] = useState([ETAPE_VIDE]);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setDescription('');
    setZoneId('');
    setEtapes([ETAPE_VIDE]);
  };

  return (
    <form
      className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            description,
            zoneId,
            modePaiement: MODE_PAIEMENT_V1,
            etapes: etapes.map(({ precision, ...etape }) => ({
              ...etape,
              quartier: precision.trim() || undefined,
            })),
          },
          {
            onSuccess: () => {
              toast.success(MESSAGE_CREATION('Courses express'));
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Zap className="size-4 text-primary" />
          <span>2. Description de la mission & Zone</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="courses-description" className="text-xs font-semibold">
              Mission / Commission à accomplir *
            </Label>
            <Input
              id="courses-description"
              className="rounded-xl"
              placeholder="Ex. Récupérer un pli à la mairie et le déposer au tribunal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="courses-zone" className="text-xs font-semibold">
              Zone opérationnelle *
            </Label>
            <ZoneSelect id="courses-zone" value={zoneId} onChange={setZoneId} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <NavIcon className="size-4 text-primary" />
            <span>3. Arrêts / Étapes de la course</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Tarif = Quartier le plus cher × {etapes.length} arrêt{etapes.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {etapes.map((etape, index) => (
            <div
              key={index}
              className="relative space-y-3 rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-mono">
                    {index + 1}
                  </span>
                  Arrêt #{index + 1}
                </span>
                {etapes.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                    onClick={() => setEtapes(etapes.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Action à cette étape *
                  </Label>
                  <Input
                    className="h-9 rounded-lg text-xs"
                    value={etape.description}
                    onChange={(e) => {
                      const description = e.target.value;
                      setEtapes(etapes.map((et, i) => (i === index ? { ...et, description } : et)));
                    }}
                    placeholder="Ex. Récupérer l'enveloppe"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Point de repère *
                  </Label>
                  <Input
                    className="h-9 rounded-lg text-xs"
                    value={etape.pointDeRepere}
                    onChange={(e) => {
                      const pointDeRepere = e.target.value;
                      setEtapes(etapes.map((et, i) => (i === index ? { ...et, pointDeRepere } : et)));
                    }}
                    placeholder="Ex. Devant le guichet 3"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Quartier de l'arrêt *
                  </Label>
                  <QuartierSelect
                    id={`courses-quartier-${index}`}
                    quartierId={etape.quartierId}
                    precision={etape.precision}
                    onChange={(choix) => setEtapes(etapes.map((et, i) => (i === index ? { ...et, ...choix } : et)))}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl border-dashed font-medium text-xs gap-1.5"
            onClick={() => setEtapes([...etapes, ETAPE_VIDE])}
          >
            <Plus className="size-3.5" />
            Ajouter un arrêt supplémentaire
          </Button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-md gap-2"
          disabled={saisir.isPending}
        >
          {saisir.isPending ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
          Enregistrer la course express
        </Button>
      </div>
    </form>
  );
}

export function SaisieManuellePage() {
  const [service, setService] = useState<TypeService>('repas');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PhoneCall className="size-4" />
            </span>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Saisie manuelle d'appel
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Prise de commande en direct par téléphone ou WhatsApp (F-ADM-04).
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <Info className="size-4 shrink-0" />
          <span>
            {MODE_PAIEMENT_V1 === 'mobile_money'
              ? 'Paiement Mobile Money requis avant expédition'
              : 'Paiement espèces à la livraison'}
          </span>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs text-xs sm:text-sm text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">Procédure opérateur :</p>
        <p>
          Renseignez le numéro de l'appelant. Le compte client s'associe automatiquement. Une fois enregistrée, la commande apparaît dans{' '}
          <strong className="text-foreground font-semibold">« Commandes »</strong> en attente de validation du transfert Mobile Money (30 min max).
        </p>
      </div>

      {/* Service Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SERVICES.map((s) => {
          const Icone = s.icone;
          const actif = service === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setService(s.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl p-3.5 text-center transition-all',
                actif
                  ? 'bg-brand-navy text-white shadow-md ring-2 ring-primary/40'
                  : 'bg-card border border-border/80 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-xs',
              )}
            >
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl transition-colors',
                  actif ? 'bg-white/20 text-white' : 'bg-muted text-foreground',
                )}
              >
                <Icone className="size-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm leading-tight">{s.label}</p>
                <p className={cn('text-[11px] mt-0.5 line-clamp-1', actif ? 'text-white/80' : 'text-muted-foreground')}>
                  {s.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Form */}
      <div>
        {service === 'repas' && <FormRepas />}
        {service === 'colis' && <FormColis />}
        {service === 'emplettes' && <FormEmplettes />}
        {service === 'courses_express' && <FormCoursesExpress />}
      </div>
    </div>
  );
}
