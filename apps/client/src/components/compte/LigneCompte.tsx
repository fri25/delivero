import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

/** One row of the account menu: internal route (to) or external link (href). */
export function LigneCompte({
  to,
  href,
  icon: Icon,
  label,
  detail,
}: {
  to?: string;
  href?: string;
  icon: LucideIcon;
  label: string;
  detail: string;
}) {
  const contenu = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-semibold text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground mt-0.5">{detail}</span>
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  );
  const classe = 'group flex min-h-16 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-secondary/50';

  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={classe}>
          {contenu}
        </a>
      ) : (
        <Link to={to ?? '/'} className={classe}>
          {contenu}
        </Link>
      )}
    </li>
  );
}
