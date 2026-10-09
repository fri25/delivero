import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const connected = () => setOnline(true);
    const disconnected = () => setOnline(false);
    window.addEventListener('online', connected);
    window.addEventListener('offline', disconnected);
    return () => {
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', disconnected);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="sticky top-14 z-30 flex min-h-11 items-center justify-center gap-2 bg-brand-navy px-4 text-center text-sm font-medium text-white">
      <WifiOff className="size-4" aria-hidden="true" /> Vous êtes hors ligne. Votre panier reste enregistré sur cet appareil.
    </div>
  );
}
