import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEntreprise } from '@/lib/entreprise';
import { useLienSupport } from '@/lib/support';
import { codeService, estOuvert, numeroLocal } from '@delivero/config/entreprise';

// Filtered by what the company opens (étape 6).
const LIENS_SERVICES = [
  { to: '/repas', label: 'Repas' },
  { to: '/colis', label: 'Envoyer un colis' },
  { to: '/courses-express', label: 'Faire une course' },
];

/** Desktop footer; on mobile the tab bar and the Compte page cover the same links. */
export function Footer() {
  const entreprise = useEntreprise();
  const lienSupport = useLienSupport();
  return (
    <footer className="hidden border-t border-border bg-card md:block">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="space-y-2">
          <p className="font-heading text-lg font-semibold">{entreprise.nomCommercial}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Livraison de repas, de colis et de courses à {entreprise.ville}, par des livreurs de confiance.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Services</p>
          <ul className="space-y-1.5 text-muted-foreground">
            {LIENS_SERVICES.filter((lien) => estOuvert(entreprise, codeService(lien.to))).map((lien) => (
              <li key={lien.to}><Link to={lien.to} className="hover:text-foreground">{lien.label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Besoin d'aide ?</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/aide" className="hover:text-foreground">Questions fréquentes</Link></li>
            <li>
              <a href={lienSupport} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp · {numeroLocal(entreprise, entreprise.whatsappSupport)}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
