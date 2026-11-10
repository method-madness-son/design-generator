import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type ProductRow = {
  id: string;
  href: string;
  title: string;
  project: string;
  status: { label: string; style: string };
  detail?: string;
  etsyUrl?: string;
  printifyUrl?: string;
  thumbnail?: ReactNode;
  needs?: { metadata: boolean; export: boolean };
};

export function NeedsCell({ needed }: { needed: boolean }) {
  return needed ? (
    <span className="inline-block whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Needed</span>
  ) : (
    <span className="text-xs text-neutral-400">—</span>
  );
}

export const STATUS_STYLES = {
  listed: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-sky-100 text-sky-800',
  ready: 'bg-violet-100 text-violet-800',
  warning: 'bg-amber-100 text-amber-800',
  idea: 'bg-neutral-100 text-neutral-600',
  none: 'bg-neutral-50 text-neutral-400',
} as const;

export function ProductTable({ rows, caption }: { rows: ProductRow[]; caption?: string }) {
  if (rows.length === 0) return <p className="mt-4 text-sm text-neutral-500">Nothing here yet.</p>;
  const showNeeds = rows.some((row) => row.needs);
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      {caption && <p className="border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500">{caption}</p>}
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="w-44 px-4 py-2 font-medium" />
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Project</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {showNeeds && <th className="px-4 py-2 font-medium">Needs Metadata</th>}
            {showNeeds && <th className="px-4 py-2 font-medium">Needs Export</th>}
            <th className="px-4 py-2 font-medium">Details</th>
            <th className="px-4 py-2 font-medium">Printify</th>
            <th className="px-4 py-2 font-medium">Etsy</th>
            <th className="w-20 px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="align-middle">
              <td className="px-4 py-2">
                {row.thumbnail && (
                  <Link href={row.href} className="block w-[150px] overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 transition hover:border-neutral-400">
                    {row.thumbnail}
                  </Link>
                )}
              </td>
              <td className="px-4 py-2">
                <Link href={row.href} className="font-medium text-neutral-900 hover:underline">
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-600">{row.project}</td>
              <td className="px-4 py-2">
                <span className={cn('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', row.status.style)}>
                  {row.status.label}
                </span>
              </td>
              {showNeeds && <td className="px-4 py-2"><NeedsCell needed={!!row.needs?.metadata} /></td>}
              {showNeeds && <td className="px-4 py-2"><NeedsCell needed={!!row.needs?.export} /></td>}
              <td className="px-4 py-2 text-neutral-600">
                {row.detail && <span className="line-clamp-2">{row.detail}</span>}
              </td>
              <td className="px-4 py-2">
                {row.printifyUrl ? (
                  <a href={row.printifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition hover:bg-sky-100">
                    Printify ↗
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-2">
                {row.etsyUrl ? (
                  <a href={row.etsyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition hover:bg-orange-100">
                    Etsy ↗
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-2">
                <Link href={row.href} className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-400">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
