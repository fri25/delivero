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
    <div className="space-y-4 rounded-3xl bg-card p-5 border border-border/70 shadow-xs">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
          <Bike className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">{actif ? 'Votre livreur' : 'Livré par'}</p>
            {actif && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Actif
              </span>
            )}
          </div>
          <p className="truncate font-heading text-base font-bold text-foreground mt-0.5">{livreur.user.nom}</p>
        </div>
      </div>
      {actif && (
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button asChild className="rounded-xl font-semibold shadow-xs">
            <a href={`tel:${livreur.user.telephone}`}>
              <Phone className="size-4" aria-hidden="true" />
              Appeler
            </a>
          </Button>
          {whatsapp && (
            <Button
              asChild
              variant="outline"
              className="rounded-xl font-semibold bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border-[#25D366]/30 dark:text-[#25D366]"
            >
              <a href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
