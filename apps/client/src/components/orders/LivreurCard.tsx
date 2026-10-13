import { lienWhatsApp } from '@delivero/config/whatsapp';
import { Bike, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivreurContact } from '@/api/types';

/**
 * F-CLI-26: who delivers, with a one-tap call or WhatsApp message (decision of
 * 13/10: WhatsApp link rather than in-app messaging).
 */
export function LivreurCard({ livreur, actif }: { livreur: LivreurContact | null; actif: boolean }) {
  if (!livreur) return null;
  const whatsapp = actif
    ? lienWhatsApp(livreur.user.telephone, 'Bonjour, je suis votre client ChapExpress.')
    : null;

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Bike className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{actif ? 'Votre livreur' : 'Livré par'}</p>
          <p className="truncate font-semibold">{livreur.user.nom}</p>
        </div>
      </div>
      {actif && (
        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <a href={`tel:${livreur.user.telephone}`}>
              <Phone aria-hidden="true" />
              Appeler
            </a>
          </Button>
          {whatsapp && (
            <Button asChild variant="outline">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
