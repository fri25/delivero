// Minimal key-value store on IndexedDB (docs/pwa-offline.md): holds the
// offline action queue and the last known lists. Falls back to memory when
// IndexedDB is unavailable (private mode, old browser): the app still works,
// the queue just does not survive a reload.

const NOM_BASE = 'chapexpress-livreur';
const MAGASIN = 'kv';

let base: Promise<IDBDatabase> | null = null;
const memoire = new Map<string, unknown>();

function ouvrir(): Promise<IDBDatabase> {
  if (!base) {
    base = new Promise((resolve, reject) => {
      const requete = indexedDB.open(NOM_BASE, 1);
      requete.onupgradeneeded = () => requete.result.createObjectStore(MAGASIN);
      requete.onsuccess = () => resolve(requete.result);
      requete.onerror = () => reject(requete.error);
    });
  }
  return base;
}

function disponible(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

async function transaction<T>(mode: IDBTransactionMode, operation: (magasin: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await ouvrir();
  return new Promise((resolve, reject) => {
    const requete = operation(db.transaction(MAGASIN, mode).objectStore(MAGASIN));
    requete.onsuccess = () => resolve(requete.result as T);
    requete.onerror = () => reject(requete.error);
  });
}

export async function lire<T>(cle: string): Promise<T | undefined> {
  if (!disponible()) return memoire.get(cle) as T | undefined;
  try {
    return await transaction<T | undefined>('readonly', (magasin) => magasin.get(cle));
  } catch {
    return memoire.get(cle) as T | undefined;
  }
}

export async function ecrire(cle: string, valeur: unknown): Promise<void> {
  memoire.set(cle, valeur);
  if (!disponible()) return;
  try {
    await transaction('readwrite', (magasin) => magasin.put(valeur, cle));
  } catch {
    // Quota or private mode: the in-memory copy keeps the session going.
  }
}

export async function effacer(cle: string): Promise<void> {
  memoire.delete(cle);
  if (!disponible()) return;
  try {
    await transaction('readwrite', (magasin) => magasin.delete(cle));
  } catch {
    // Nothing to do: the entry will simply be ignored.
  }
}
