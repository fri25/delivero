import { ArrowLeft, CircleHelp, Clock3, MapPin, MessageCircle, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const WHATSAPP_SUPPORT = 'https://wa.me/22900000000';

const QUESTIONS = [
  {
    icon: PackageCheck,
    title: 'Où suivre ma commande ?',
    body: 'Ouvrez « Mes commandes », puis sélectionnez la commande pour consulter son statut et ses détails.',
  },
  {
    icon: MapPin,
    title: 'Comment aider le livreur à me trouver ?',
    body: 'Ajoutez un point de repère précis, comme une boutique, une école ou un carrefour proche. Il complète votre adresse.',
  },
  {
    icon: ShieldCheck,
    title: 'Comment confirmer la remise d’un colis ?',
    body: 'Transmettez au destinataire le code de remise affiché sur le détail du colis. Le livreur le vérifie lors de la remise.',
  },
];

export function HelpPage() {
  return (
    <div className="space-y-5 pb-8">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Retour à l’accueil</Link>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-brand-blue p-6 text-white sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10"><CircleHelp className="size-6" /></div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">ChapExpress · Natitingou</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Comment pouvons-nous vous aider ?</h1>
        <p className="mt-2 max-w-lg text-sm text-white/75">Consultez les réponses rapides ou écrivez-nous sur WhatsApp pour votre commande.</p>
        <Button asChild className="mt-5 h-12 bg-white text-brand-navy hover:bg-white/90">
          <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Contacter ChapExpress sur WhatsApp</a>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Questions fréquentes</h2>
        {QUESTIONS.map(({ icon: Icon, title, body }) => (
          <article key={title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></div>
            <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p></div>
          </article>
        ))}
      </section>

      <div className="flex items-start gap-3 rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground"><Clock3 className="mt-0.5 size-4 shrink-0 text-primary" /><p>Pour nous aider à répondre plus vite, indiquez votre numéro de commande dans votre message.</p></div>
    </div>
  );
}
