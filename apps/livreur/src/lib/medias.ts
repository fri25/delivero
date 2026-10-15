import { apiFetch } from '@/api/client';

export type UsageMedia = 'colis' | 'courses';

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
 * Compresses a camera photo under `tailleMax` bytes before upload (3G
 * budget, ≤ 300 Ko per image): downscale to 1600 px, then lower JPEG quality.
 */
export async function compresserImage(fichier: File, tailleMax: number): Promise<Blob> {
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

/** Signed direct upload to Cloudinary; returns the image URL to send with the order. */
export async function envoyerPhoto(fichier: File, usage: UsageMedia, tailleMax: number): Promise<string> {
  const image = await compresserImage(fichier, tailleMax);
  const signature = await apiFetch<SignatureUpload>('/medias/signature', {
    method: 'POST',
    body: { usage },
  });

  const formulaire = new FormData();
  formulaire.append('file', image, 'photo.jpg');
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

/** Smaller Cloudinary rendition for thumbnails. */
export function miniature(url: string, largeur = 320): string {
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${largeur},q_auto,f_auto/`);
}
