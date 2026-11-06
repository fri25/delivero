import { useState, type ComponentProps, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LIBELLES_FONCTIONNALITES, useCreerEntreprise, useOffres } from '@/api/plateforme';

function Champ({ id, label, aide, ...props }: { id: string; label: string; aide?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <Input id={id} className="rounded-xl" {...props} />
      {aide && <p className="text-[11px] text-muted-foreground">{aide}</p>}
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
      <h2 className="font-heading text-base font-bold text-foreground">{titre}</h2>
      {children}
    </section>
  );
}

/** "Livraisons Djougou" → "livraisons-djougou". */
const versSlug = (nom: string) =>
  nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

/** A new company, ready to serve (étape 9). */
export function NouvelleEntreprisePage() {
  const creer = useCreerEntreprise();
  const { data: offres } = useOffres();
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouche, setSlugTouche] = useState(false);
  const [nomCommercial, setNomCommercial] = useState('');
  const [ville, setVille] = useState('');
  const [tauxCommission, setTauxCommission] = useState('');
  const [fonctionnalites, setFonctionnalites] = useState<Set<string>>(new Set(['service.repas', 'service.colis', 'paiement.mobile_money']));
  const [planCode, setPlanCode] = useState('pilote');
  const [statutAbonnement, setStatutAbonnement] = useState<'essai' | 'actif'>('essai');
  const [adminNom, setAdminNom] = useState('');
  const [adminTelephone, setAdminTelephone] = useState('');
  const [adminMotDePasse, setAdminMotDePasse] = useState('');

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        creer.mutate(
          {
            slug,
            nom: nom.trim(),
            nomCommercial: nomCommercial.trim() || undefined,
            ville: ville.trim(),
            tauxCommission: Number(tauxCommission.replace(',', '.')),
            fonctionnalites: [...fonctionnalites],
            planCode,
            statutAbonnement,
            admin: { nom: adminNom.trim(), telephone: adminTelephone.trim(), motDePasse: adminMotDePasse || undefined },
          },
          {
            onSuccess: (entreprise) => {
              toast.success(`${entreprise.nom} créée. Ajoutez-lui un domaine pour ouvrir ses applications.`, { duration: 10_000 });
              navigate(`/entreprises/${entreprise.id}`);
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="space-y-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Entreprises
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Nouvelle entreprise</h1>
        <p className="text-sm text-muted-foreground">Au Bénin (devise XOF, numéros +229). L’entreprise règle ensuite elle-même son logo, ses couleurs et ses contacts.</p>
      </div>

      <Section titre="Entreprise">
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ
            id="ne-nom"
            label="Raison sociale *"
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              if (!slugTouche) setSlug(versSlug(e.target.value));
            }}
            required
            minLength={2}
          />
          <Champ
            id="ne-slug"
            label="Identifiant *"
            aide="Sous-domaine et préfixe technique : minuscules, chiffres, tirets. Non modifiable ensuite."
            className="rounded-xl font-mono"
            value={slug}
            onChange={(e) => {
              setSlugTouche(true);
              setSlug(e.target.value);
            }}
            pattern="[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]"
            required
          />
          <Champ id="ne-commercial" label="Nom commercial" aide="Affiché dans les applications. Par défaut : la raison sociale." value={nomCommercial} onChange={(e) => setNomCommercial(e.target.value)} />
          <Champ id="ne-ville" label="Ville *" value={ville} onChange={(e) => setVille(e.target.value)} required minLength={2} />
          <Champ
            id="ne-commission"
            label="Commission Repas (%) *"
            aide="Taux convenu avec l’entreprise ; aucun taux par défaut."
            inputMode="decimal"
            value={tauxCommission}
            onChange={(e) => setTauxCommission(e.target.value)}
            pattern="\d{1,3}([.,]\d{1,2})?"
            required
          />
        </div>
      </Section>

      <Section titre="Fonctionnalités ouvertes">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(LIBELLES_FONCTIONNALITES).map(([code, libelle]) => (
            <li key={code}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-3 py-2.5 text-sm hover:bg-muted/40">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={fonctionnalites.has(code)}
                  onChange={(e) => {
                    const suivantes = new Set(fonctionnalites);
                    if (e.target.checked) suivantes.add(code);
                    else suivantes.delete(code);
                    setFonctionnalites(suivantes);
                  }}
                />
                {libelle}
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Offre">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ne-plan" className="text-xs font-semibold">Offre *</Label>
            <select id="ne-plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm">
              {(offres ?? [{ code: 'pilote', nom: 'Pilote' }]).map((o) => (
                <option key={o.code} value={o.code}>{o.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ne-statut" className="text-xs font-semibold">Statut *</Label>
            <select id="ne-statut" value={statutAbonnement} onChange={(e) => setStatutAbonnement(e.target.value as 'essai' | 'actif')} className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="essai">Essai</option>
              <option value="actif">Actif</option>
            </select>
          </div>
        </div>
      </Section>

      <Section titre="Premier administrateur">
        <div className="grid gap-3 sm:grid-cols-3">
          <Champ id="ne-admin-nom" label="Nom *" value={adminNom} onChange={(e) => setAdminNom(e.target.value)} required />
          <Champ id="ne-admin-tel" label="Téléphone *" inputMode="tel" placeholder="01 57 86 69 59" value={adminTelephone} onChange={(e) => setAdminTelephone(e.target.value)} required />
          <Champ
            id="ne-admin-mdp"
            label="Mot de passe provisoire"
            aide="Requis pour un nouveau numéro. Un compte existant garde le sien."
            value={adminMotDePasse}
            onChange={(e) => setAdminMotDePasse(e.target.value)}
            minLength={8}
          />
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost" className="h-11 rounded-2xl">
          <Link to="/">Annuler</Link>
        </Button>
        <Button type="submit" disabled={creer.isPending} className="h-11 rounded-2xl px-6 font-bold">
          {creer.isPending ? 'Création…' : 'Créer l’entreprise'}
        </Button>
      </div>
    </form>
  );
}
