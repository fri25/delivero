import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Enseigne } from './Enseigne';
import type { ImageVariant } from '@/data/images';

/**
 * Cadre image partagé restaurants/plats : ratio fixé (jamais de saut de mise
 * en page), chargement progressif (aplat → fondu vers l'image nette), zoom
 * léger au survol, et repli sur l'enseigne générée si aucune photo.
 */
export function MediaFrame({
  nom,
  image: imageProp,
  ratio = 'square',
  priority = false,
  vignette = false,
  className,
  children,
}: {
  nom: string;
  /** Photo réelle (URL simple depuis l'API) ou jeu de démo (avec srcset). */
  image?: ImageVariant | string | null;
  ratio?: 'square' | 'wide';
  priority?: boolean;
  vignette?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const image: ImageVariant | undefined =
    typeof imageProp === 'string' ? { src: imageProp, srcSet: '' } : (imageProp ?? undefined);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        ratio === 'square' ? 'aspect-square' : 'aspect-[3/2]',
        className,
      )}
    >
      {image ? (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={ratio === 'square' ? '160px' : '(min-width: 640px) 480px, 100vw'}
          alt={nom}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-signature) group-hover:scale-[1.04]',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : (
        <Enseigne nom={nom} />
      )}
      {vignette && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
      )}
      {children}
    </div>
  );
}
