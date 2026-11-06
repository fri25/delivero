export function formatPrixFcfa(value: string | number | null): string {
  if (value === null) {
    return '—';
  }
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

export function formatDateHeure(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
