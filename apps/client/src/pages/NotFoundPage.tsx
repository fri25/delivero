import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-sm space-y-4 py-10 text-center">
      <p className="font-heading text-4xl font-semibold text-muted-foreground">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Ce lien ne mène nulle part. Il a peut-être été mal copié.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}
