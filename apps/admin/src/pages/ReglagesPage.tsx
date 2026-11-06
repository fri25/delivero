import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, KeyRound, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { decouperNom } from '@delivero/config/entreprise';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEnregistrerFedapay,
  useModifierParametres,
  useParametresEntreprise,
  type ParametresEntreprise,
} from '@/api/entreprise';
import { formatDateHeure } from '@/lib/format';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function Champ({
  id,
  label,
  aide,
  ...props
}: { id: string; label: string; aide?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <Input id={id} className="rounded-xl" {...props} />
      {aide && <p className="text-[11px] text-muted-foreground">{aide}</p>}
    </div>
  );
}

function Section({ titre, description, children }: { titre: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs">
      <div className="border-b border-border/60 pb-3">
        <h2 className="font-heading text-lg font-bold text-foreground">{titre}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ChampCouleur({ id, label, valeur, onChange }: { id: string; label: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (sélecteur)`}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent p-1"
        />
        <Input
          id={id}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          className="rounded-xl font-mono uppercase"
          required
        />
      </div>
    </div>
  );
}

/** What the client app will look like: wordmark, button, badge. */
function Apercu({ nom, primaire, marine, signal }: { nom: string; primaire: string; marine: string; signal: string }) {
  const [debut, fin] = decouperNom(nom || 'Entreprise');
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3" aria-label="Aperçu des couleurs">
      <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Aperçu</p>
      <p className="font-heading text-2xl font-extrabold tracking-tight">
        <span style={{ color: marine }}>{debut}</span>
        <span style={{ color: primaire }}>{fin}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-2xl px-5 text-sm font-bold text-white" style={{ backgroundColor: primaire }}>
          Commander
        </span>
        <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold text-white" style={{ backgroundColor: signal }}>
          Nouveau
        </span>
        <span className="inline-flex h-10 items-center rounded-2xl px-5 text-sm font-bold text-white" style={{ backgroundColor: marine }}>
          Suivre ma commande
        </span>
      </div>
    </div>
  );
}

function FormulaireIdentite({ parametres }: { parametres: ParametresEntreprise }) {
  const modifier = useModifierParametres();
  const [nomCommercial, setNomCommercial] = useState(parametres.nomCommercial);
  const [logoUrl, setLogoUrl] = useState(parametres.logoUrl ?? '');
  const [ville, setVille] = useState(parametres.ville);
  const [couleurPrimaire, setCouleurPrimaire] = useState(parametres.couleurPrimaire);
  const [couleurMarine, setCouleurMarine] = useState(parametres.couleurMarine);
  const [couleurSignal, setCouleurSignal] = useState(parametres.couleurSignal);
  const [telephoneContact, setTelephoneContact] = useState(parametres.telephoneContact ?? '');
  const [whatsappSupport, setWhatsappSupport] = useState(parametres.whatsappSupport ?? '');
  const [emailContact, setEmailContact] = useState(parametres.emailContact ?? '');
  const [tauxCommission, setTauxCommission] = useState(String(parametres.tauxCommission));

  const taux = Number(tauxCommission.replace(',', '.'));
  const tauxChange = taux !== parametres.tauxCommission;

  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    if (tauxChange && !window.confirm(`Passer la commission Repas de ${parametres.tauxCommission} % à ${taux} % pour les prochaines commandes ?`)) {
      return;
    }
    modifier.mutate(
      {
        nomCommercial: nomCommercial.trim(),
        logoUrl: logoUrl.trim() || null,
        ville: ville.trim(),
        couleurPrimaire,
        couleurMarine,
        couleurSignal,
        telephoneContact: telephoneContact.trim() || null,
        whatsappSupport: whatsappSupport.trim() || null,
        emailContact: emailContact.trim() || null,
        tauxCommission: taux,
      },
      {
        onSuccess: () => toast.success('Réglages enregistrés. Les applications les affichent à leur prochaine ouverture.'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form className="space-y-6" onSubmit={enregistrer}>
      <Section titre="Identité" description="Nom et logo affichés dans les applications client, livreur et partenaires.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ id="reg-nom" label="Nom commercial *" value={nomCommercial} onChange={(e) => setNomCommercial(e.target.value)} required minLength={2} maxLength={60} />
          <Champ id="reg-ville" label="Ville *" value={ville} onChange={(e) => setVille(e.target.value)} required minLength={2} />
          <div className="sm:col-span-2">
            <Champ
              id="reg-logo"
              label="Adresse du logo (facultatif)"
              aide="Lien https vers une image (PNG ou SVG). Laisser vide pour le logotype texte."
              type="url"
              placeholder="https://…"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section titre="Couleurs" description="Couleur principale (boutons, liens), couleur sombre (titres, en-têtes) et couleur d’alerte (badges).">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <ChampCouleur id="reg-primaire" label="Principale" valeur={couleurPrimaire} onChange={setCouleurPrimaire} />
            <ChampCouleur id="reg-marine" label="Sombre" valeur={couleurMarine} onChange={setCouleurMarine} />
            <ChampCouleur id="reg-signal" label="Alerte" valeur={couleurSignal} onChange={setCouleurSignal} />
          </div>
          <Apercu nom={nomCommercial} primaire={couleurPrimaire} marine={couleurMarine} signal={couleurSignal} />
        </div>
      </Section>

      <Section titre="Contacts" description="Affichés aux clients (aide, WhatsApp du support) et utilisés dans les messages envoyés.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Champ id="reg-tel" label="Téléphone" inputMode="tel" placeholder="01 57 86 69 59" value={telephoneContact} onChange={(e) => setTelephoneContact(e.target.value)} />
          <Champ id="reg-wa" label="WhatsApp du support" inputMode="tel" placeholder="01 57 86 69 59" value={whatsappSupport} onChange={(e) => setWhatsappSupport(e.target.value)} />
          <Champ id="reg-email" label="E-mail" type="email" value={emailContact} onChange={(e) => setEmailContact(e.target.value)} />
        </div>
      </Section>

      <Section titre="Commission Repas" description="Frais de service ajoutés aux commandes Repas, en pourcentage du sous-total.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Champ
            id="reg-commission"
            label="Taux (%) *"
            inputMode="decimal"
            value={tauxCommission}
            onChange={(e) => setTauxCommission(e.target.value)}
            required
            pattern="\d{1,3}([.,]\d{1,2})?"
          />
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          S’applique aux commandes passées après l’enregistrement ; les commandes en cours gardent leur montant.
        </p>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={modifier.isPending} className="h-11 rounded-2xl px-6 font-bold bg-primary text-white">
          {modifier.isPending ? 'Enregistrement…' : 'Enregistrer les réglages'}
        </Button>
      </div>
    </form>
  );
}

function SectionFedapay({ parametres }: { parametres: ParametresEntreprise }) {
  const enregistrer = useEnregistrerFedapay();
  const [cleSecrete, setCleSecrete] = useState('');
  const [secretWebhook, setSecretWebhook] = useState('');
  const [environnement, setEnvironnement] = useState<'sandbox' | 'live'>(parametres.fedapay.environnement ?? 'sandbox');
  const etat = parametres.fedapay;
  const urlWebhook = `${API_URL.replace(/\/api$/, '')}${etat.cheminWebhook}`;

  return (
    <Section titre="Paiement Mobile Money (FedaPay)" description="Les paiements de vos clients arrivent sur votre propre compte FedaPay.">
      {etat.configure ? (
        <p className="flex items-start gap-2 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Compte configuré ({etat.environnement === 'live' ? 'production' : 'test'})
            {etat.source === 'environnement'
              ? ' par la configuration du serveur. Saisissez vos clés ici pour les gérer vous-même.'
              : etat.modifieLe
                ? `, clés enregistrées le ${formatDateHeure(etat.modifieLe)}.`
                : '.'}
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Aucun compte FedaPay : vos clients ne peuvent pas payer par Mobile Money.
        </p>
      )}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Adresse du webhook à déclarer dans FedaPay</p>
        <p className="font-mono break-all text-foreground">{urlWebhook}</p>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          enregistrer.mutate(
            { cleSecrete: cleSecrete.trim(), secretWebhook: secretWebhook.trim(), environnement },
            {
              onSuccess: () => {
                setCleSecrete('');
                setSecretWebhook('');
                toast.success('Clés FedaPay enregistrées.');
              },
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        <Champ
          id="fp-cle"
          label="Clé secrète *"
          aide="Jamais réaffichée après l’enregistrement."
          type="password"
          autoComplete="off"
          value={cleSecrete}
          onChange={(e) => setCleSecrete(e.target.value)}
          required
          minLength={10}
        />
        <Champ
          id="fp-webhook"
          label="Secret du webhook *"
          type="password"
          autoComplete="off"
          value={secretWebhook}
          onChange={(e) => setSecretWebhook(e.target.value)}
          required
          minLength={10}
        />
        <div className="space-y-1.5">
          <Label htmlFor="fp-env" className="text-xs font-semibold">Environnement</Label>
          <select
            id="fp-env"
            value={environnement}
            onChange={(e) => setEnvironnement(e.target.value as 'sandbox' | 'live')}
            className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
          >
            <option value="sandbox">Test (sandbox)</option>
            <option value="live">Production (live)</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={enregistrer.isPending} className="h-10 rounded-xl font-bold gap-2" variant="outline">
            <KeyRound className="size-4" aria-hidden="true" />
            {enregistrer.isPending ? 'Enregistrement…' : etat.source === 'entreprise' ? 'Remplacer les clés' : 'Enregistrer les clés'}
          </Button>
        </div>
      </form>
    </Section>
  );
}

/** Settings of the company (étape 8): admin_entreprise only. */
export function ReglagesPage() {
  const { data: parametres, isPending, isError } = useParametresEntreprise();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Réglages</h1>
        <p className="text-sm text-muted-foreground mt-1">Identité, contacts, commission et compte de paiement de l’entreprise.</p>
      </div>
      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : isError || !parametres ? (
        <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Impossible de charger les réglages. Réessayez dans un instant.
        </p>
      ) : (
        <>
          <FormulaireIdentite key={parametres.slug} parametres={parametres} />
          <SectionFedapay parametres={parametres} />
        </>
      )}
    </div>
  );
}
