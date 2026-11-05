import { Button } from '@/components/ui/button';
import { useLienSupport } from '@/lib/support';

const QUESTIONS = [
  {
    title: 'Où suivre ma commande ?',
    body: 'Ouvrez « Mes commandes », puis sélectionnez la commande pour consulter son statut et ses détails.',
  },
  {
    title: 'Comment aider le livreur à me trouver ?',
    body: 'Ajoutez un point de repère précis, comme une boutique, une école ou un carrefour proche. Il complète votre adresse.',
  },
  {
    title: 'Comment confirmer la remise d’un colis ?',
    body: 'Transmettez au destinataire le code de remise affiché sur le détail du colis. Le livreur le vérifie lors de la remise.',
  },
];

export function HelpPage() {
  const lienSupport = useLienSupport();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="titre-page">Aide</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Les réponses rapides sont ci-dessous. Pour une commande en particulier, écrivez-nous sur WhatsApp en indiquant
          son numéro.
        </p>
        <Button asChild className="mt-4 h-11 px-5 text-[15px] font-bold">
          <a href={lienSupport} target="_blank" rel="noreferrer">
            Écrire sur WhatsApp
          </a>
        </Button>
      </header>

      <section>
        <h2 className="mb-3 font-heading text-xl font-extrabold">Questions fréquentes</h2>
        <div className="carte divide-y divide-border px-4">
          {QUESTIONS.map(({ title, body }) => (
            <article key={title} className="py-4">
              <h3 className="text-base font-bold">{title}</h3>
              <p className="mt-1 text-[15px] text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
