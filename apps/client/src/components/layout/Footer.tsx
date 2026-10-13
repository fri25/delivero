import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_SUPPORT } from '@/lib/support';

/** Desktop footer; on mobile the tab bar and the Compte page cover the same links. */
export function Footer() {
  return (
    <footer className="hidden border-t border-border bg-card md:block">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="space-y-2">
          <p className="font-heading text-lg font-semibold">ChapExpress</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Livraison de repas, de colis et de courses à Natitingou, par des livreurs de confiance.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Services</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/repas" className="hover:text-foreground">Repas</Link></li>
            <li><Link to="/colis" className="hover:text-foreground">Envoyer un colis</Link></li>
            <li><Link to="/courses-express" className="hover:text-foreground">Faire une course</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Besoin d'aide ?</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/aide" className="hover:text-foreground">Questions fréquentes</Link></li>
            <li>
              <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp · 01 57 86 69 59
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
