import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { activerPush, clePubliquePush, pushSupporte } from '@/lib/push';
import { useAuthStore } from '@/stores/auth-store';

const CLE_MASQUAGE = 'chapexpress-partenaires-alertes-masquees';

function lireMasquage(): boolean {
  try {
    return localStorage.getItem(CLE_MASQUAGE) === '1';
  } catch {
    return false;
  }
}

/**
 * Offers new-order alerts once, while the device has neither accepted nor
 * refused notifications. Without them the restaurant only hears new orders
 * with the app open (real-time + polling).
 */
export function ActiverAlertesCard() {
  const token = useAuthStore((state) => state.token);
  const [masquee, setMasquee] = useState(lireMasquage);
  const [enCours, setEnCours] = useState(false);
  const eligible = Boolean(token) && !masquee && pushSupporte() && Notification.permission === 'default';

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
      // Private mode: the card simply comes back next time.
    }
  };

  return (
    <section className="relative overflow-hidden flex items-start gap-3.5 rounded-3xl bg-gradient-to-r from-brand-navy via-brand-blue to-primary p-4 sm:p-5 text-white shadow-md">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
        <BellRing className="size-5 text-cyan-300 animate-bounce" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="font-heading font-bold text-base leading-snug">Soyez prévenu de chaque nouvelle commande</p>
          <p className="mt-1 text-xs sm:text-sm text-white/80 leading-relaxed">
            Recevez une notification sonore et visuelle dès qu’un client commande, même écran éteint ou
            application en arrière-plan.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full bg-white font-semibold text-brand-navy hover:bg-white/90 shadow-sm active:scale-95 transition-all"
          disabled={enCours}
          onClick={async () => {
            setEnCours(true);
            try {
              await activerPush(token);
              toast.success('Alertes activées avec succès.');
              masquer();
            } catch (error) {
              toast.error((error as Error).message);
              if (Notification.permission === 'denied') masquer();
            } finally {
              setEnCours(false);
            }
          }}
        >
          {enCours ? 'Activation...' : 'Activer les alertes'}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Plus tard"
        className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        onClick={masquer}
      >
        <X className="size-4" />
      </Button>
    </section>
  );
}
