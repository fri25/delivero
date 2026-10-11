import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotFoundPage } from '@/pages/NotFoundPage';

// A lazily loaded page whose chunk no longer exists (new deployment while the
// app was open) or failed to download on a flaky 3G link.
function estEchecChargement(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message)
  );
}

// errorElement of the root route: rendered without RootLayout, so it carries
// its own minimal frame and plain links (the router may be the thing that
// failed).
export function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <NotFoundPage />
      </main>
    );
  }

  const chargement = estEchecChargement(error);

  return (
    <main className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">
        {chargement ? 'La page n’a pas pu se charger' : 'Une erreur est survenue'}
      </h1>
      <p className="text-sm text-muted-foreground">
        {chargement
          ? 'Vérifiez votre connexion, puis réessayez. Une nouvelle version de l’application est peut-être disponible.'
          : 'Réessayez dans un instant. Si le problème continue, contactez-nous sur WhatsApp.'}
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          Retour à l'accueil
        </Button>
      </div>
    </main>
  );
}
