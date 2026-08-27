import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePointerArticle } from '@/api/commandes-emplettes';
import { formatPrixFcfa } from '@/lib/format';
import type { ArticleEmplette, StatutArticleEmplette } from '@/api/types';

const PREFERENCE_LABELS: Record<string, string> = {
  equivalent: 'Remplacer par équivalent',
  appeler: "M'appeler",
  ne_pas_acheter: 'Ne pas acheter',
};

const STATUT_LABELS: Record<StatutArticleEmplette, string> = {
  en_attente: 'En attente',
  achete: 'Acheté',
  indisponible: 'Indisponible',
  remplace: 'Remplacé',
};

type ActionEnCours = 'achete' | 'remplace' | null;

export function ArticlePointageRow({
  commandeId,
  article,
  disabled,
}: {
  commandeId: string;
  article: ArticleEmplette;
  disabled: boolean;
}) {
  const [action, setAction] = useState<ActionEnCours>(null);
  const [prixReel, setPrixReel] = useState('');
  const [produitRemplacementLibelle, setProduitRemplacementLibelle] = useState('');
  const pointer = usePointerArticle();

  if (article.statut !== 'en_attente') {
    return (
      <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
        <div>
          <p className="text-sm">{article.libelle}</p>
          {article.produitRemplacementLibelle && (
            <p className="text-xs text-muted-foreground">
              Remplacé par : {article.produitRemplacementLibelle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {article.prixReel && <span className="text-sm">{formatPrixFcfa(article.prixReel)}</span>}
          <Badge>{STATUT_LABELS[article.statut]}</Badge>
        </div>
      </div>
    );
  }

  const confirmer = (statut: 'achete' | 'indisponible' | 'remplace') => {
    if ((statut === 'achete' || statut === 'remplace') && !prixReel) {
      toast.error('Indiquez le prix réel.');
      return;
    }
    if (statut === 'remplace' && !produitRemplacementLibelle.trim()) {
      toast.error('Précisez le produit de remplacement.');
      return;
    }

    pointer.mutate(
      {
        commandeId,
        articleId: article.id,
        statut,
        prixReel: statut === 'indisponible' ? undefined : Number(prixReel),
        produitRemplacementLibelle:
          statut === 'remplace' ? produitRemplacementLibelle.trim() : undefined,
      },
      {
        onSuccess: () => setAction(null),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-2 border-b border-border py-2 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-sm">{article.libelle}</p>
        <span className="text-xs text-muted-foreground">
          {PREFERENCE_LABELS[article.preferenceRemplacement]}
        </span>
      </div>

      {action === null && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={() => setAction('achete')}
          >
            Acheté
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || pointer.isPending}
            onClick={() => confirmer('indisponible')}
          >
            Indisponible
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => setAction('remplace')}
          >
            Remplacé
          </Button>
        </div>
      )}

      {action !== null && (
        <div className="space-y-1.5">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Prix réel (FCFA)"
            value={prixReel}
            onChange={(event) => setPrixReel(event.target.value)}
          />
          {action === 'remplace' && (
            <Input
              placeholder="Produit de remplacement"
              value={produitRemplacementLibelle}
              onChange={(event) => setProduitRemplacementLibelle(event.target.value)}
            />
          )}
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              disabled={pointer.isPending}
              onClick={() => confirmer(action)}
            >
              Confirmer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAction(null);
                setPrixReel('');
                setProduitRemplacementLibelle('');
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
