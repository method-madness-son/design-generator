import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1.5 text-sm">
      <Link href="/" className="text-neutral-400 hover:text-neutral-900">
        Home
      </Link>
      {items.map((crumb, i) => (
        <Fragment key={i}>
          <span className="text-neutral-300">/</span>
          {crumb.href && i < items.length - 1 ? (
            <Link href={crumb.href} className="text-neutral-500 hover:text-neutral-900">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-neutral-700">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
