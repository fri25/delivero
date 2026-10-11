import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { activerPush, clePubliquePush, pushSupporte } from '@/lib/push';
import { useAuthStore } from '@/stores/auth-store';

const CLE_MASQUAGE = 'chapexpress-notifications-masquees';

function lireMasquage(): boolean {
  try {
    return localStorage.getItem(CLE_MASQUAGE) === '1';
  } catch {
    return false;
  }
}

/**
 * Offers Web Push once, to a signed-in client whose browser supports it and
 * has not answered yet. Without it, alerts still arrive by WhatsApp/SMS.
 */
export function ActiverNotificationsCard() {
  const token = useAuthStore((state) => state.token);
  const [masquee, setMasquee] = useState(lireMasquage);
  const [enCours, setEnCours] = useState(false);
  const eligible =
    Boolean(token) && !masquee && pushSupporte() && Notification.permission === 'default';

  const { data: clePublique } = useQuery({
    queryKey: ['push-cle-publique'],
    queryFn: clePubliquePush,
    enabled: eligible,
    staleTime: Infinity,
  });

  if (!eligible || !clePublique || !token) return null;

  const masquer = () => {
    setMasquee(true);
    try {
      localStorage.setItem(CLE_MASQUAGE, '1');
    } catch {
      // Private mode: the card simply comes back next visit.
    }
  };

  return (
    <section className="flex items-start gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-foreground/10">
      <Bell className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-medium">Suivez vos commandes en direct</p>
          <p className="text-xs text-muted-foreground">
            Recevez une alerte à chaque étape. Sinon, nous vous prévenons par WhatsApp ou SMS.
          </p>
        </div>
        <Button
          size="sm"
          disabled={enCours}
          onClick={async () => {
            setEnCours(true);
            try {
              await activerPush(token);
              toast.success('Notifications activées.');
              masquer();
            } catch (error) {
              toast.error((error as Error).message);
              if (Notification.permission === 'denied') masquer();
            } finally {
              setEnCours(false);
            }
          }}
        >
          {enCours ? 'Activation...' : 'Activer les notifications'}
        </Button>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Plus tard" onClick={masquer}>
        <X className="size-4" />
      </Button>
    </section>
  );
}
