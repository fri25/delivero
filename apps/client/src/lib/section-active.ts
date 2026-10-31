import { useEffect, useState } from 'react';

/**
 * Scroll-spy for an anchored menu: returns the id of the first section
 * sitting just below the sticky bars, so the matching chip can be
 * highlighted. Ids are keyed by value, a fresh array each render is fine.
 */
export function useSectionActive(ids: string[]): string | null {
  const cle = ids.join('|');
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ordre = cle ? cle.split('|') : [];
    const sections = ordre
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const visibles = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibles.add(entry.target.id);
          else visibles.delete(entry.target.id);
        }
        const premiere = ordre.find((id) => visibles.has(id));
        if (premiere) setActive(premiere);
      },
      // Top band = header + category bar; bottom band ignores sections barely peeking in.
      { rootMargin: '-140px 0px -55% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [cle]);

  return active;
}
