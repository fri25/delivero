import { apiFetch } from '@/api/client';

// Web Push for livreurs: "Nouvelle course" and "Course attribuée" alerts,
// even with the app closed. Same API endpoints as the client app.

export function pushSupporte(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function cleEnOctets(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const brut = atob(base64);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
  return octets;
}

export async function clePubliquePush(): Promise<string | null> {
  const { clePublique } = await apiFetch<{ clePublique: string | null }>('/notifications/push/cle-publique');
  return clePublique;
}

/** Asks permission, subscribes this phone and registers it with the API. */
export async function activerPush(token: string): Promise<void> {
  const clePublique = await clePubliquePush();
  if (!clePublique) {
    throw new Error('Les alertes ne sont pas disponibles pour le moment.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Alertes refusées : gardez l’onglet « À prendre » ouvert pour voir les nouvelles courses.');
  }
  const registration = await navigator.serviceWorker.ready;
  const abonnement =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(clePublique) }));
  await apiFetch<void>('/notifications/push/abonnements', { method: 'POST', body: abonnement.toJSON(), token });
}

/**
 * On logout: a shared phone must not keep receiving the previous livreur's
 * alerts. Best effort, never blocks the logout.
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
