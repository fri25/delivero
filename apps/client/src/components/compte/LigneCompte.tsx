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
      <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold group-hover:underline">{label}</span>
        <span className="block truncate text-sm text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-[#8a93a3]" aria-hidden="true" />
    </>
  );
  const classe = 'group flex min-h-16 items-center gap-3.5 py-3';

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
