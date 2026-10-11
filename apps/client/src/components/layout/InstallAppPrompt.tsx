import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent || installed) return null;
  return (
    <aside className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Smartphone className="size-5" /></div><div><p className="font-semibold">ChapExpress sur votre téléphone</p><p className="text-xs text-muted-foreground">Installez l’application pour la retrouver rapidement.</p></div></div>
      <Button size="sm" onClick={async () => {
        await promptEvent.prompt();
        const result = await promptEvent.userChoice;
        if (result.outcome === 'accepted') setInstalled(true);
        setPromptEvent(null);
      }}><Download className="size-4" /> Installer</Button>
    </aside>
  );
}
