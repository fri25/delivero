export function formatPrixFcfa(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

// Origine volontairement omise : Google Maps utilise alors la position GPS
// actuelle du livreur comme point de départ.
export function googleMapsRouteUrl(destination: string, waypoints: string[] = []): string {
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function formatDateHeure(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
