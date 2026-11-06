import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients } from '@/api/entreprise';
import { formatDateHeure } from '@/lib/format';

/** Clients of the company (étape 8), the most recent first. */
export function ClientsPage() {
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useClients(recherche, page);

  // Searches once typing pauses, from the first page.
  useEffect(() => {
    const minuteur = window.setTimeout(() => {
      setRecherche(saisie.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(minuteur);
  }, [saisie]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.parPage)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.total} client${data.total > 1 ? 's' : ''} inscrit${data.total > 1 ? 's' : ''}.` : 'Comptes clients de l’entreprise.'}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Rechercher un client"
            placeholder="Nom ou téléphone"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
      </div>
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : isError || !data ? (
        <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Impossible de charger les clients.</p>
      ) : data.clients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 size-6" aria-hidden="true" />
          {recherche ? 'Aucun client ne correspond.' : 'Aucun client inscrit pour le moment.'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Inscrit le</th>
                  <th className="px-4 py-3 font-semibold text-right">Commandes</th>
                  <th className="px-4 py-3 font-semibold">Dernière commande</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((client) => (
                  <tr key={client.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{client.nom}</p>
                      <a href={`tel:${client.telephone}`} className="font-mono text-xs text-muted-foreground hover:text-primary">
                        {client.telephone}
                      </a>
                      {client.statut !== 'actif' && <span className="ml-2 text-xs font-bold text-destructive">Suspendu</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateHeure(client.inscritLe)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{client.commandes}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.derniereCommande ? formatDateHeure(client.derniereCommande) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" className="rounded-xl" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédents
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {pages}
              </span>
              <Button variant="outline" className="rounded-xl" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Suivants
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
