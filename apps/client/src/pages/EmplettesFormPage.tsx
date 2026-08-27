import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddressPicker } from '@/components/adresses/AddressPicker';
import { ArticleFormRow } from '@/components/emplettes/ArticleFormRow';
import { useAuthStore } from '@/stores/auth-store';
import { useZones } from '@/api/zones';
import { useCreateCommandeEmplettes, useEstimationEmplettes } from '@/api/commandes-emplettes';
import { formatPrixFcfa } from '@/lib/format';
import type { ModeFinancementEmplettes, PreferenceRemplacement } from '@/api/types';

const MODE_FINANCEMENT_LABELS: Record<ModeFinancementEmplettes, string> = {
  mobile_money_anticipe: 'Mobile Money, budget payé à l’avance',
  especes_livraison: 'Espèces, tout à la livraison',
  avance_livreur: 'Avance par le livreur, remboursée à la livraison',
};

interface ArticleDraft {
  libelle: string;
  preferenceRemplacement: PreferenceRemplacement;
}

function nouvelArticle(): ArticleDraft {
  return { libelle: '', preferenceRemplacement: 'ne_pas_acheter' };
}

export function EmplettesFormPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { data: zones } = useZones();
  const createCommande = useCreateCommandeEmplettes();

  const [adresseId, setAdresseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [lieuAchat, setLieuAchat] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [articles, setArticles] = useState<ArticleDraft[]>([nouvelArticle()]);
  const [modeFinancement, setModeFinancement] = useState<ModeFinancementEmplettes>('especes_livraison');

  const zoneUnique = zones?.length === 1 ? zones.at(0) : undefined;
  const effectiveZoneId = zoneId ?? zoneUnique?.id ?? null;

  const budgetNombre = Number(budgetMax);
  const estimation = useEstimationEmplettes(
    effectiveZoneId ?? undefined,
    Number.isFinite(budgetNombre) && budgetNombre > 0 ? budgetNombre : undefined,
  );

  const articlesValides = articles.filter((article) => article.libelle.trim().length > 0);
  const peutConfirmer =
    Boolean(adresseId) &&
    Boolean(effectiveZoneId) &&
    Number.isFinite(budgetNombre) &&
    budgetNombre > 0 &&
    articlesValides.length > 0;

  const majArticle = (index: number, patch: Partial<ArticleDraft>) => {
    setArticles((current) =>
      current.map((article, i) => (i === index ? { ...article, ...patch } : article)),
    );
  };

  const envoyer = () => {
    if (!token) {
      toast.info('Connectez-vous pour envoyer une demande d’emplettes.');
      navigate('/connexion');
      return;
    }
    if (!adresseId || !effectiveZoneId) {
      toast.error('Choisissez votre adresse de livraison.');
      return;
    }

    createCommande.mutate(
      {
        zoneId: effectiveZoneId,
        adresseId,
        lieuAchat: lieuAchat.trim() || undefined,
        budgetMax: budgetNombre,
        modeFinancement,
        articles: articlesValides.map((article) => ({
          libelle: article.libelle.trim(),
          preferenceRemplacement: article.preferenceRemplacement,
        })),
      },
      {
        onSuccess: (commande) => {
          toast.success('Demande d’emplettes envoyée !');
          navigate(`/emplettes/commandes/${commande.id}`);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          Faire vos emplettes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marché, supermarché, pharmacie — un livreur achète pour vous, dans la limite de votre budget.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Adresse de livraison</h2>
        {token ? (
          <AddressPicker value={adresseId} onChange={setAdresseId} />
        ) : (
          <p className="text-sm text-muted-foreground">Connectez-vous pour choisir une adresse.</p>
        )}
      </section>

      {zones && zones.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Zone</h2>
          <Select value={zoneId ?? undefined} onValueChange={setZoneId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      <section className="space-y-1.5">
        <Label htmlFor="lieuAchat">Lieu d'achat (facultatif)</Label>
        <Input
          id="lieuAchat"
          placeholder="Ex. Marché central, au choix du livreur..."
          value={lieuAchat}
          onChange={(event) => setLieuAchat(event.target.value)}
        />
      </section>

      <section className="space-y-1.5">
        <Label htmlFor="budgetMax">Budget maximum (FCFA)</Label>
        <Input
          id="budgetMax"
          type="number"
          min={1}
          inputMode="numeric"
          value={budgetMax}
          onChange={(event) => setBudgetMax(event.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Si le total réel dépasse ce budget, le livreur vous demandera votre accord avant de continuer.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Liste de courses</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setArticles((current) => [...current, nouvelArticle()])}
          >
            Ajouter un article
          </Button>
        </div>
        <div className="space-y-3">
          {articles.map((article, index) => (
            <ArticleFormRow
              key={index}
              libelle={article.libelle}
              preference={article.preferenceRemplacement}
              onLibelleChange={(value) => majArticle(index, { libelle: value })}
              onPreferenceChange={(value) => majArticle(index, { preferenceRemplacement: value })}
              onRemove={() => setArticles((current) => current.filter((_, i) => i !== index))}
              canRemove={articles.length > 1}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Financement</h2>
        <Select
          value={modeFinancement}
          onValueChange={(value) => setModeFinancement(value as ModeFinancementEmplettes)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(MODE_FINANCEMENT_LABELS) as [ModeFinancementEmplettes, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </section>

      {estimation.data && (
        <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Budget</span>
            <span>{formatPrixFcfa(estimation.data.budgetMax)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Frais de livraison</span>
            <span>{formatPrixFcfa(estimation.data.fraisLivraison)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Frais de service (estimé)</span>
            <span>{formatPrixFcfa(estimation.data.fraisServiceEstime)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 font-medium text-foreground">
            <span>Total indicatif</span>
            <span>{formatPrixFcfa(estimation.data.totalEstime)}</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            Montant indicatif : le décompte final dépend du prix réel des articles achetés.
          </p>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!peutConfirmer || createCommande.isPending}
        onClick={envoyer}
      >
        {createCommande.isPending ? 'Envoi...' : token ? 'Confirmer la demande' : 'Se connecter pour confirmer'}
      </Button>
    </div>
  );
}
