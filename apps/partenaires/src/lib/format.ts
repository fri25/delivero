export function formatPrixFcfa(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}
