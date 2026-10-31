import Link from "next/link";
import { pageCountLabel } from "@/components/kdp/BookSheet";
import { loadBooks, type LoadedBook } from "@/lib/kdpBooks";
import { TRIM_SPECS, formatInches } from "@/lib/kdpSizes";
import { LOW_CONTENT_TEMPLATE_IDS, LOW_CONTENT_TEMPLATE_SUMMARIES } from "@/lib/kdpTemplates";

export const metadata = {
  title: "KDP wireframes",
  description: "Unbranded paperback interior wireframes, including low-content books.",
};

export default function KdpIndexPage() {
  const books = loadBooks();
  const lowContent = books.filter((book) => book.content === "low-content");
  const standard = books.filter((book) => book.content === "standard");
  const ungrouped = books.filter((book) => book.content === null);

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">KDP wireframes</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Grayscale paperback interiors. Low-content books are log books, trackers, journals, planners, and notebooks:
        the interior repeats a fill-in template. They use the same trim, bleed, gutter, and metadata checks as every
        other book. Print-ready PDFs are built with <code className="text-sm">npm run book-pdf</code>.
      </p>

      <BookSection
        title="Low-content books"
        description="Set content to low-content, pick isbn none or own, and repeat a template until the book has at least 24 pages."
        books={lowContent}
      />
      <h2 className="mt-8 text-sm font-semibold tracking-wide text-neutral-500 uppercase">Page templates</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LOW_CONTENT_TEMPLATE_IDS.map((id) => (
          <li key={id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
            <span className="font-medium text-neutral-900">{id}</span>
            <span className="text-neutral-600"> · {LOW_CONTENT_TEMPLATE_SUMMARIES[id]}</span>
          </li>
        ))}
      </ul>

      {standard.length > 0 ? (
        <BookSection
          title="Other interiors"
          description="Standard paperbacks. These still need an ISBN at upload. This wireframe does not store that number."
          books={standard}
        />
      ) : null}
      {ungrouped.length > 0 ? (
        <BookSection title="Needs a content field" description="These manifests did not say standard or low-content." books={ungrouped} />
      ) : null}
    </>
  );
}

function BookSection({ title, description, books }: { title: string; description: string; books: LoadedBook[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>
      {books.length === 0 ? (
        <p className="mt-4 text-neutral-600">No books in this section yet. Add a manifest under kdp/.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const bookTitle = book.manifest?.kdp.title ?? book.id;
            const trim = book.manifest ? TRIM_SPECS[book.manifest.trim] : null;
            const isbn =
              book.manifest?.content === "low-content"
                ? book.manifest.isbn === "none"
                  ? " · no ISBN"
                  : " · own ISBN"
                : "";
            return (
              <li key={book.id}>
                <Link
                  href={`/kdp/${book.id}`}
                  className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
                >
                  <h3 className="font-semibold text-neutral-900">{bookTitle}</h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {book.manifest
                      ? `${book.manifest.format} · ${trim?.label ?? book.manifest.trim} · ${book.geometry ? pageCountLabel(book.geometry.pageCount) : "not ready"}${isbn}`
                      : "Manifest needs fixes"}
                  </p>
                  {book.geometry ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Bleed page {formatInches(book.geometry.pageWidthIn)} × {formatInches(book.geometry.pageHeightIn)} ·
                      gutter {formatInches(book.geometry.gutterIn)}
                    </p>
                  ) : null}
                  {book.errors.length > 0 ? <p className="mt-2 text-xs text-neutral-700">{book.errors[0]}</p> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
