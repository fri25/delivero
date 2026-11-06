import { useState } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntreprises, useJournal, type EntreeJournal } from '@/api/plateforme';
import { formatDateHeure } from '@/lib/format';

const ACTIONS = [
  { valeur: '', libelle: 'Toutes les actions' },
  { valeur: 'securite.', libelle: 'Sécurité' },
  { valeur: 'POST', libelle: 'Créations' },
  { valeur: 'PATCH', libelle: 'Modifications' },
  { valeur: 'PUT', libelle: 'Remplacements' },
  { valeur: 'DELETE', libelle: 'Suppressions' },
];

function Ligne({ entree }: { entree: EntreeJournal }) {
  const securite = entree.action.startsWith('securite.');
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5">
      {securite ? (
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-mono text-sm font-semibold text-foreground break-words">{entree.action}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateHeure(entree.createdAt)} · {entree.tenant ? entree.tenant.nom : 'Plateforme'} ·{' '}
          {entree.acteur ? `${entree.acteur.nom} (${entree.acteur.telephone ?? '—'})` : 'compte inconnu'}
          {entree.ip && <span className="font-mono"> · {entree.ip}</span>}
        </p>
        {entree.details?.chemin && <p className="font-mono text-[11px] text-muted-foreground break-all">{entree.details.chemin}</p>}
        {entree.details?.champs && entree.details.champs.length > 0 && (
          <p className="text-[11px] text-muted-foreground">Champs envoyés : {entree.details.champs.join(', ')}</p>
        )}
      </div>
    </li>
  );
}

/** Platform journal: every company, plus the platform's own actions. */
export function JournalPage() {
  const { data: entreprises } = useEntreprises();
  const [entreprise, setEntreprise] = useState('');
  const [action, setAction] = useState('');
  const journal = useJournal(entreprise, action);
  const entrees = journal.data?.pages.flatMap((page) => page.entrees) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Actions des entreprises et de la plateforme, événements de sécurité.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-56 space-y-1.5">
            <Label htmlFor="j-entreprise" className="text-xs font-semibold">Entreprise</Label>
            <select id="j-entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm">
              <option value="">Toutes</option>
              <option value="plateforme">Plateforme seulement</option>
              {(entreprises ?? []).map((e) => (
                <option key={e.id} value={e.id}>{e.nomCommercial ?? e.nom}</option>
              ))}
            </select>
          </div>
          <div className="w-48 space-y-1.5">
            <Label htmlFor="j-action" className="text-xs font-semibold">Action</Label>
            <select id="j-action" value={action} onChange={(e) => setAction(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm">
              {ACTIONS.map((a) => (
                <option key={a.valeur} value={a.valeur}>{a.libelle}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {journal.isPending ? (
        <div className="space-y-2">
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
