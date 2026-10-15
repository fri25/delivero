import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/stores/auth-store';

export type UsageMedia = 'plats';

export interface MediasConfig {
  actif: boolean;
  tailleMaxOctets: number;
}

interface SignatureUpload {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  folder: string;
  allowed_formats: string;
  signature: string;
}

const DIMENSION_MAX = 1600;

/**
 * Compresse une photo de plat sous `tailleMax` octets avant l'envoi
 * (budget réseau 3G/4G, ≤ 300 Ko par image) : redimensionnement canvas à 1600 px
 * puis ajustement de la qualité JPEG.
 */
export async function compresserImage(fichier: File, tailleMax = 300 * 1024): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  try {
    let echelle = Math.min(1, DIMENSION_MAX / Math.max(image.width, image.height));
    for (let tentative = 0; tentative < 6; tentative += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * echelle);
      canvas.height = Math.round(image.height * echelle);
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const qualite of [0.82, 0.7, 0.55]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualite));
        if (blob && blob.size <= tailleMax) return blob;
      }
      echelle *= 0.75;
    }
  } finally {
    image.close();
  }
  throw new Error('Photo trop lourde, même compressée. Essayez une autre photo.');
}

/** Envoi direct et signé vers Cloudinary ; renvoie l'URL sécurisée de l'image. */
export async function envoyerPhoto(
  fichier: File,
  usage: UsageMedia = 'plats',
  tailleMax = 300 * 1024,
): Promise<string> {
  const token = useAuthStore.getState().token;
  const image = await compresserImage(fichier, tailleMax);
  const signature = await apiFetch<SignatureUpload>('/medias/signature', {
    method: 'POST',
    body: { usage },
    token,
  });

  const formulaire = new FormData();
  formulaire.append('file', image, 'plat.jpg');
  formulaire.append('api_key', signature.apiKey);
  formulaire.append('timestamp', signature.timestamp);
  formulaire.append('folder', signature.folder);
  formulaire.append('allowed_formats', signature.allowed_formats);
  formulaire.append('signature', signature.signature);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: 'POST',
      body: formulaire,
    });
  } catch {
    throw new Error('Envoi de la photo impossible. Vérifiez votre connexion.');
  }
  if (!response.ok) {
    throw new Error('La photo n’a pas pu être envoyée. Réessayez.');
  }
  const { secure_url: url } = (await response.json()) as { secure_url: string };
  return url;
}

/** Transformation d'URL Cloudinary pour charger une miniature optimisée. */
export function miniature(url: string, largeur = 320): string {
  if (!url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${largeur},q_auto,f_auto/`);
}
