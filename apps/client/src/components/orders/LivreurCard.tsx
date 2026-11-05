import { lienWhatsApp } from '@delivero/config/whatsapp';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivreurContact } from '@/api/types';
import { useEntreprise } from '@/lib/entreprise';

/**
 * F-CLI-26: who delivers, with a one-tap call or WhatsApp message (decision of
 * 13/10: WhatsApp link rather than in-app messaging).
 */
export function LivreurCard({ livreur, actif }: { livreur: LivreurContact | null; actif: boolean }) {
  const entreprise = useEntreprise();
  if (!livreur) return null;
  const whatsapp = actif
    ? lienWhatsApp(livreur.user.telephone, `Bonjour, je suis votre client ${entreprise.nomCommercial}.`)
    : null;

  return (
    <section className="carte space-y-3 p-4 sm:p-5">
      <div>
        <p className="text-sm text-muted-foreground">{actif ? 'Votre livreur' : 'Livré par'}</p>
        <p className="truncate text-lg font-bold">{livreur.user.nom}</p>
      </div>
      {actif && (
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="h-11 font-bold">
            <a href={`tel:${livreur.user.telephone}`}>
              <Phone className="size-4" aria-hidden="true" />
              Appeler
            </a>
          </Button>
          {whatsapp && (
            <Button asChild variant="outline" className="h-11 border-[#1f9d55] font-bold text-[#1f9d55] hover:bg-[#1f9d55]/5 hover:text-[#1f9d55]">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
