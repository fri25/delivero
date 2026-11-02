import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface State { hasError: boolean }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep diagnostics local and avoid logging user data or request payloads.
    console.error('Client interface rendering error', error.name, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
          <section className="carte w-full max-w-md p-6">
            <h1 className="titre-page">La page n’a pas pu s’ouvrir</h1>
            <p className="mt-2 text-sm text-muted-foreground">Rechargez l’application. Votre panier reste enregistré sur cet appareil.</p>
            <Button className="mt-5 w-full" onClick={() => window.location.reload()}>Recharger la page</Button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
