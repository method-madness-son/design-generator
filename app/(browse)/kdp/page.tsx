import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageCountLabel } from "@/components/kdp/BookSheet";
import { ProductTable, STATUS_STYLES, type ProductRow } from "@/components/ProductTable";
import { loadBooks, type LoadedBook } from "@/lib/kdpBooks";
import { TRIM_SPECS, formatInches } from "@/lib/kdpSizes";
import { LOW_CONTENT_TEMPLATE_IDS, LOW_CONTENT_TEMPLATE_SUMMARIES } from "@/lib/kdpTemplates";
import { loadProjects, type LoadedLowContentBook } from "@/lib/lowcontent/books";

export const metadata = {
  title: "KDP",
  description: "Paperback interior wireframes and low-content books for KDP.",
};

function bookStatus(book: LoadedBook): ProductRow["status"] {
  if (book.errors.length > 0) return { label: "Has errors", style: STATUS_STYLES.warning };
  if (!book.geometry) return { label: "Not ready", style: STATUS_STYLES.idea };
  return { label: "Ready", style: STATUS_STYLES.ready };
}

function bookDetail(book: LoadedBook): string {
  if (!book.manifest) return "Manifest needs fixes";
  const trim = TRIM_SPECS[book.manifest.trim];
  const pages = book.geometry ? pageCountLabel(book.geometry.pageCount) : "not ready";
  const isbn =
    book.manifest.content === "low-content"
      ? book.manifest.isbn === "none" ? " · no ISBN" : " · own ISBN"
      : "";
  return `${book.manifest.format} · ${trim?.label ?? book.manifest.trim} · ${pages}${isbn}`;
}

function bookRows(books: LoadedBook[]): ProductRow[] {
  return books.map((book) => ({
    id: book.id,
    href: `/kdp/${book.id}`,
    title: book.manifest?.kdp.title ?? book.id,
    project: book.content ?? "unset",
    status: bookStatus(book),
    detail: bookDetail(book),
  }));
}

function lcStatus(book: LoadedLowContentBook): ProductRow["status"] {
  if (book.errors.length > 0) return { label: "Has errors", style: STATUS_STYLES.warning };
  if (!book.geometry) return { label: "Not ready", style: STATUS_STYLES.idea };
  return { label: "Ready", style: STATUS_STYLES.ready };
}

function lcDetail(book: LoadedLowContentBook): string {
  if (!book.manifest) return "Manifest needs fixes";
  return `${book.manifest.trim} · ${book.manifest.paper} · ${book.manifest.ink} · ${book.manifest.pageCount} pages`;
}

export default function KdpIndexPage() {
  const books = loadBooks();
  const lowContent = books.filter((book) => book.content === "low-content");
  const standard = books.filter((book) => book.content === "standard");
  const ungrouped = books.filter((book) => book.content === null);

  const lcProjects = loadProjects();
  const totalLcBooks = lcProjects.reduce((sum, g) => sum + g.books.length, 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "KDP" }]} />
      <h1 className="mt-2 text-2xl font-semibold">KDP</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Paperback interiors and low-content books for KDP.
        Print-ready PDFs are built with <code className="text-sm">npm run book-pdf</code>.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        {books.length} wireframes · {totalLcBooks} low-content books
      </p>

      {/* ── Low-content books (themed, from lowcontent/) ── */}
      {lcProjects.some((g) => g.books.length > 0) && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Low-content books ({totalLcBooks})</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Journals, planners, logbooks, and trackers. Each book is a manifest under <code className="text-sm">lowcontent/</code>.
            Interiors and covers render to print-ready PDFs.
          </p>
          {lcProjects.map((group) => {
            const rows: ProductRow[] = group.books.map((book) => ({
              id: book.id,
              href: `/lowcontent/${book.id}`,
              title: book.manifest?.title ?? book.id,
              project: group.project?.title ?? group.slug,
              status: lcStatus(book),
              detail: lcDetail(book),
            }));
            if (rows.length === 0) return null;
            return (
              <div key={group.slug} className="mt-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  {group.project?.title ?? group.slug} ({group.books.length})
                </h3>
                {group.errors.length > 0 && <p className="mt-1 text-sm text-neutral-700">{group.errors[0]}</p>}
                <ProductTable rows={rows} />
              </div>
            );
          })}
        </section>
      )}

      {/* ── Wireframe low-content books (from kdp/) ── */}
      {lowContent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">Wireframe low-content ({lowContent.length})</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Grayscale wireframe interiors. Set content to low-content, pick isbn none or own, and repeat a template.
          </p>
          <ProductTable rows={bookRows(lowContent)} />
        </section>
      )}

      <h2 className="mt-8 text-sm font-semibold tracking-wide text-neutral-500 uppercase">Page templates</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LOW_CONTENT_TEMPLATE_IDS.map((id) => (
          <li key={id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
            <span className="font-medium text-neutral-900">{id}</span>
            <span className="text-neutral-600"> · {LOW_CONTENT_TEMPLATE_SUMMARIES[id]}</span>
          </li>
        ))}
      </ul>

      {standard.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">Other interiors ({standard.length})</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Standard paperbacks. These still need an ISBN at upload. This wireframe does not store that number.
          </p>
          <ProductTable rows={bookRows(standard)} />
        </section>
      )}

      {ungrouped.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">Needs a content field ({ungrouped.length})</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            These manifests did not say standard or low-content.
          </p>
          <ProductTable rows={bookRows(ungrouped)} />
        </section>
      )}
    </>
  );
}
