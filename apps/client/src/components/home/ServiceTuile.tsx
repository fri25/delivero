import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ImageVariant } from '@/data/images';

/**
 * Service tile of the home hub: photo on top, name and one line below, on a
 * white card. Same size for every service; the photo carries the variety.
 */
export function ServiceTuile({
  to,
  label,
  description,
  image,
  illustration,
  priority = false,
}: {
  to: string;
  label: string;
  description: string;
  image?: ImageVariant;
  /** Fallback when no real photo exists (e.g. Emplettes). */
  illustration?: ReactNode;
  priority?: boolean;
}) {
  return (
    <Link
      to={to}
      className="carte group flex flex-col overflow-hidden transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="relative block aspect-[4/3] bg-accent lg:aspect-[16/9]">
        {image ? (
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 1024px) 280px, 33vw"
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary">{illustration}</span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <span className="text-sm leading-tight font-bold sm:text-base">{label}</span>
        <span className="mt-0.5 hidden text-sm text-muted-foreground sm:block">{description}</span>
      </span>
    </Link>
  );
}
