import { useState } from 'react';
import { AlertTriangle, CloudOff, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { synchroniser, useEnLigne } from '@/api/hors-ligne';
import { SERVICE_LABELS } from '@/lib/taches';
import { useAuthStore } from '@/stores/auth-store';
import { useFileActionsStore } from '@/stores/file-actions-store';
import { cn } from '@/lib/utils';

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}

/**
 * Network state + offline queue (docs/pwa-offline.md "Indicateur réseau"):
 * offline / syncing / N actions waiting, and the actions the server refused,
 * which the livreur must handle (retry or drop). Hidden when all is well.
 */
export function BandeauReseau() {
  const queryClient = useQueryClient();
  const enLigne = useEnLigne();
  const userId = useAuthStore((state) => state.user?.id);
  const toutes = useFileActionsStore((state) => state.actions);
  const synchronisation = useFileActionsStore((state) => state.synchronisation);
  const reessayer = useFileActionsStore((state) => state.reessayer);
  const abandonner = useFileActionsStore((state) => state.abandonner);
  const [detail, setDetail] = useState(false);

  const actions = toutes.filter((action) => action.userId === userId);
  const enAttente = actions.filter((action) => !action.erreur);
  const refusees = actions.filter((action) => action.erreur);

  if (enLigne && actions.length === 0) return null;

  return (
    <div role="status" className="sticky top-14 z-10 border-b border-border">
      <div
        className={cn(
          'flex min-h-11 items-center justify-between gap-3 px-4 py-2 text-sm',
          !enLigne ? 'bg-foreground text-background' : refusees.length > 0 ? 'bg-destructive/10' : 'bg-secondary',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {!enLigne ? (
            <CloudOff className="size-4 shrink-0" aria-hidden="true" />
          ) : refusees.length > 0 ? (
            <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          ) : (
            <RefreshCw className={cn('size-4 shrink-0', synchronisation && 'animate-spin')} aria-hidden="true" />
          )}
          <span className="min-w-0">
            {!enLigne
              ? enAttente.length > 0
                ? `Hors ligne — ${pluriel(enAttente.length, 'action')} en attente`
                : 'Hors ligne — vous pouvez continuer vos courses'
              : synchronisation
                ? 'Synchronisation…'
                : enAttente.length > 0
                  ? `${pluriel(enAttente.length, 'action')} en attente d’envoi`
                  : null}
            {refusees.length > 0 && (
              <span className="font-medium text-destructive">
                {enAttente.length > 0 || !enLigne ? ' · ' : ''}
                {pluriel(refusees.length, 'action')} refusée{refusees.length > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </span>
        {actions.length > 0 && (
          <button type="button" className="shrink-0 text-sm font-semibold underline" onClick={() => setDetail(!detail)}>
            {detail ? 'Masquer' : 'Voir'}
          </button>
        )}
      </div>

      {detail && (
        <ul className="divide-y divide-border bg-card">
          {actions.map((action) => (
            <li key={action.id} className="space-y-2 px-4 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{action.libelle}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {SERVICE_LABELS[action.service]} ·{' '}
                  {new Date(action.creeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {action.erreur ? (
                <>
                  <p className="text-destructive">Refusée : {action.erreur}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        reessayer(action.id);
                        void synchroniser(queryClient);
                      }}
                    >
                      Réessayer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        abandonner(action.id);
                        void queryClient.invalidateQueries();
                      }}
                    >
                      Abandonner
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">En attente d’envoi</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
