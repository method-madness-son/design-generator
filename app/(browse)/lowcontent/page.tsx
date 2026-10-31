import Link from 'next/link';
import { loadProjects } from '@/lib/lowcontent/books';
import { formatInches } from '@/lib/lowcontent/specs';

export const metadata = {
  title: 'Low-content books',
  description: 'KDP low-content interiors, wrap covers, and wireframe previews.',
};

export default function LowContentIndexPage() {
  const projects = loadProjects();

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Low-content books</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Journals, planners, logbooks, and trackers. Each book is a manifest under <code className="text-sm">lowcontent/</code>.
        Interiors and covers render to print-ready PDFs. This list is separate from the KDP wireframe and from the cheat-sheet book engine.
      </p>
      <p className="mt-2 text-xs text-neutral-500">Palette and fonts come from theme/global.json.</p>
      {projects.map((group) => (
        <section key={group.slug} className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">{group.project?.title ?? group.slug}</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">{group.project?.description}</p>
          {group.errors.length > 0 ? <p className="mt-2 text-sm text-neutral-700">{group.errors[0]}</p> : null}
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.books.map((book) => {
              const title = book.manifest?.title ?? book.id;
              const geometry = book.geometry;
              return (
                <li key={book.id}>
                  <Link
                    href={`/lowcontent/${book.id}`}
                    className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
                  >
                    <h3 className="font-semibold text-neutral-900">{title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {book.manifest
                        ? `${book.manifest.trim} · ${book.manifest.paper} · ${book.manifest.ink} · ${book.manifest.pageCount} pages`
                        : 'Manifest needs fixes'}
                    </p>
                    {geometry ? (
                      <p className="mt-2 text-xs text-neutral-500">
                        Interior {formatInches(geometry.pageWidthIn)} × {formatInches(geometry.pageHeightIn)} · gutter{' '}
                        {formatInches(geometry.gutterIn)}
                        {book.theme ? ` · ${book.theme.paletteLabel}` : ''}
                      </p>
                    ) : null}
                    {book.errors.length > 0 ? <p className="mt-2 text-xs text-neutral-700">{book.errors[0]}</p> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
