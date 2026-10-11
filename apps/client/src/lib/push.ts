import { apiFetch } from '@/api/client';

// Web Push (F-CLI-09). Optional: when unsupported, refused or disabled
// server-side, the API falls back to WhatsApp/SMS on its own.

export function pushSupporte(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function cleEnOctets(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const brut = atob(base64);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
  return octets;
}

export async function clePubliquePush(): Promise<string | null> {
  const { clePublique } = await apiFetch<{ clePublique: string | null }>('/notifications/push/cle-publique');
  return clePublique;
}

/** Asks permission, subscribes this browser and registers it with the API. */
export async function activerPush(token: string): Promise<void> {
  const clePublique = await clePubliquePush();
  if (!clePublique) {
    throw new Error('Les notifications ne sont pas disponibles pour le moment.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notifications refusées. Vous recevrez le suivi par WhatsApp ou SMS.');
  }

  const registration = await navigator.serviceWorker.ready;
  const abonnement =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: cleEnOctets(clePublique),
    }));

  await apiFetch<void>('/notifications/push/abonnements', {
    method: 'POST',
    body: abonnement.toJSON(),
    token,
  });
}

/**
 * Called on logout: on a shared phone, the next account must not receive the
 * previous one's alerts. Best effort, never blocks the logout.
 */
export async function desactiverPush(token: string): Promise<void> {
  if (!pushSupporte()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const abonnement = await registration?.pushManager.getSubscription();
    if (!abonnement) return;
    await apiFetch<void>('/notifications/push/abonnements', {
      method: 'DELETE',
      body: { endpoint: abonnement.endpoint },
      token,
    });
    await abonnement.unsubscribe();
  } catch {
    // Offline or already gone: the API drops dead subscriptions on its own.
  }
}
