export function formatPrixFcfa(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatDateHeure(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
