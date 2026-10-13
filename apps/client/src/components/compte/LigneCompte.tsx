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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block truncate text-sm text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </>
  );
  const classe = 'flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60';

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
