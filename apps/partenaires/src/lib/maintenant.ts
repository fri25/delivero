import { useEffect, useState } from 'react';

/** Current time, refreshed every 30 s so "il y a 12 min" keeps moving. */
export function useMaintenant(intervalleMs = 30_000): number {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const minuterie = window.setInterval(() => setMaintenant(Date.now()), intervalleMs);
    return () => window.clearInterval(minuterie);
  }, [intervalleMs]);
  return maintenant;
}
