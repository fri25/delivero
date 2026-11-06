import { useState } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournal, type EntreeJournal } from '@/api/entreprise';
import { formatDateHeure } from '@/lib/format';

// Filters on the prefix of the action (apps/api/src/entreprise).
const FILTRES = [
  { valeur: '', libelle: 'Toutes les actions' },
  { valeur: 'POST', libelle: 'Créations' },
  { valeur: 'PATCH', libelle: 'Modifications' },
  { valeur: 'DELETE', libelle: 'Suppressions' },
  { valeur: 'securite.', libelle: 'Sécurité' },
];

const VERBES: Record<string, string> = { POST: 'Création', PUT: 'Remplacement', PATCH: 'Modification', DELETE: 'Suppression' };

const SECURITE: Record<string, string> = {
  'securite.jeton_autre_entreprise': 'Jeton d’une autre entreprise refusé',
  'securite.webhook_autre_entreprise': 'Webhook de paiement d’une autre entreprise ignoré',
};

/** `PATCH /api/admin/zones/:id` → « Modification · admin/zones/:id ». */
function libelle(entree: EntreeJournal): { titre: string; securite: boolean } {
  if (entree.action.startsWith('securite.')) {
    return { titre: SECURITE[entree.action] ?? entree.action, securite: true };
  }
  const [methode = '', route = ''] = entree.action.split(' ');
  return { titre: `${VERBES[methode] ?? methode} · ${route.replace(/^\/api\//, '')}`, securite: false };
}

function Ligne({ entree }: { entree: EntreeJournal }) {
  const { titre, securite } = libelle(entree);
  const champs = entree.details?.champs ?? [];
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5">
      {securite ? (
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground break-words">{titre}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateHeure(entree.createdAt)} · {entree.acteur ? `${entree.acteur.nom} (${entree.acteur.telephone ?? '—'})` : 'Compte inconnu'}
          {entree.ip && <span className="font-mono"> · {entree.ip}</span>}
        </p>
        {champs.length > 0 && <p className="text-[11px] text-muted-foreground">Champs envoyés : {champs.join(', ')}</p>}
      </div>
    </li>
  );
}

/**
 * Activity journal of the company (étape 8): every change made through the
 * back-office and the apps, plus the security events. Values are never
 * recorded, only the fields sent.
 */
export function JournalPage() {
  const [action, setAction] = useState('');
  const journal = useJournal(action);
  const entrees = journal.data?.pages.flatMap((page) => page.entrees) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Journal d’activité</h1>
          <p className="text-sm text-muted-foreground mt-1">Qui a modifié quoi, et quand. Les valeurs saisies ne sont jamais enregistrées.</p>
        </div>
        <div className="w-52 space-y-1.5">
          <Label htmlFor="journal-filtre" className="text-xs font-semibold">Filtrer</Label>
          <select
            id="journal-filtre"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            {FILTRES.map((f) => (
              <option key={f.valeur} value={f.valeur}>{f.libelle}</option>
            ))}
          </select>
        </div>
      </div>
      {journal.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : journal.isError ? (
        <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Impossible de charger le journal.</p>
      ) : entrees.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucune entrée.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {entrees.map((entree) => (
              <Ligne key={entree.id} entree={entree} />
            ))}
          </ul>
          {journal.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-2xl" disabled={journal.isFetchingNextPage} onClick={() => void journal.fetchNextPage()}>
                {journal.isFetchingNextPage ? 'Chargement…' : 'Entrées plus anciennes'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
