import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS } from '@/api/historique';
import { commandesInviteMemorisees } from '@/lib/commandes-invite';
import { useAuthStore } from '@/stores/auth-store';

/** Signed-out home: guest orders placed from this phone (F-CLI-02). */
export function CommandesInviteCard() {
  const token = useAuthStore((state) => state.token);
  const commandes = commandesInviteMemorisees().slice(0, 3);
  if (token || commandes.length === 0) return null;

  return (
    <section className="space-y-2 rounded-2xl bg-card p-3.5 ring-1 ring-foreground/10">
      <h2 className="text-sm font-semibold">Vos commandes sans compte</h2>
      <ul className="divide-y divide-border">
        {commandes.map((commande) => (
          <li key={commande.jeton}>
            <Link to={`/suivi/${commande.jeton}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                {TYPE_SERVICE_LABELS[commande.typeService]}
                <span className="text-muted-foreground">
                  {' '}
                  · {new Date(commande.creeeLe).toLocaleDateString('fr-FR')}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
