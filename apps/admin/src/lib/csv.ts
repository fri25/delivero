import type { AdminCommandeRow, ClotureCaisse, TypeService } from '@/api/types';
import { formatDateHeure } from '@/lib/format';

const SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Courses express',
};

const LIBELLES_PAIEMENT: Record<string, string> = {
  en_attente: 'Non payée',
  echoue: 'Paiement échoué',
  paye: 'Payée',
  a_rembourser: 'À rembourser',
  rembourse: 'Remboursée',
};

function echapperValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '';
  const texte = String(valeur).trim();
  if (texte.includes(';') || texte.includes('"') || texte.includes('\n') || texte.includes('\r')) {
    return `"${texte.replaceAll('"', '""')}"`;
  }
  return texte;
}

/**
 * Construit un contenu CSV avec BOM UTF-8 et séparateur point-virgule (compatible avec Excel FR).
 */
export function genererCsv(colonnes: string[], lignes: unknown[][]): string {
  const entete = colonnes.map(echapperValeur).join(';');
  const corps = lignes.map((ligne) => ligne.map(echapperValeur).join(';')).join('\r\n');
  return '\uFEFF' + entete + '\r\n' + corps;
}

/**
 * Déclenche le téléchargement immédiat du fichier CSV dans le navigateur.
 */
export function telechargerFichierCsv(nomFichier: string, contenu: string) {
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.setAttribute('download', nomFichier);
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/**
 * Exporte la liste des commandes au format CSV (F-ADM-15).
 */
export function exporterCommandesCsv(commandes: AdminCommandeRow[], suffixe = '') {
  const colonnes = [
    'N° Commande',
    'Date & Heure',
    'Service',
    'Statut commande',
    'Détail / Nature',
    'Nom client',
    'Téléphone client',
    'Nom livreur',
    'Téléphone livreur',
    'Montant total (FCFA)',
    'Mode paiement',
    'Statut paiement',
    'Saisie manuelle',
  ];

  const lignes = commandes.map((c) => [
    c.id,
    formatDateHeure(c.createdAt),
    SERVICE_LABELS[c.typeService] ?? c.typeService,
    c.statut?.replaceAll('_', ' ') ?? '—',
    c.nature ?? '—',
    c.client?.nom ?? '—',
    c.client?.telephone ?? '—',
    c.livreur?.nom ?? 'Non assigné',
    c.livreur?.telephone ?? '—',
    c.montantTotal ?? '0',
    c.paiement?.mode ?? '—',
    LIBELLES_PAIEMENT[c.paiement?.statut ?? ''] ?? c.paiement?.statut ?? '—',
    c.saisieManuelle ? 'Oui' : 'Non',
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const nomFichier = `commandes-chapexpress${suffixe ? `-${suffixe}` : ''}-${dateStr}.csv`;
  const csv = genererCsv(colonnes, lignes);
  telechargerFichierCsv(nomFichier, csv);
}

/**
 * Exporte les clôtures de caisse déclarées par les livreurs (F-ADM-15 / F-ADM-12/13).
 */
export function exporterCaisseCsv(clotures: ClotureCaisse[]) {
  const colonnes = [
    'ID Clôture',
    'Date déclaration',
    'Livreur',
    'Téléphone livreur',
    'Montant théorique (FCFA)',
    'Montant déclaré (FCFA)',
    'Écart (FCFA)',
    'Rapprochée',
    'Rapprochée par',
    'Date rapprochement',
  ];

  const lignes = clotures.map((cl) => [
    cl.id,
    formatDateHeure(cl.createdAt),
    cl.livreur.user.nom,
    cl.livreur.user.telephone,
    cl.montantTheorique,
    cl.montantDeclare,
    cl.ecart,
    cl.rapprocheeAt ? 'Oui' : 'Non',
    cl.rapprocheePar?.nom ?? '—',
    cl.rapprocheeAt ? formatDateHeure(cl.rapprocheeAt) : '—',
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const nomFichier = `clotures-caisse-chapexpress-${dateStr}.csv`;
  const csv = genererCsv(colonnes, lignes);
  telechargerFichierCsv(nomFichier, csv);
}
