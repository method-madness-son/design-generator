import Link from "next/link";
import { pageCountLabel } from "@/components/kdp/BookSheet";
import { loadBooks } from "@/lib/kdpBooks";
import { TRIM_SPECS, formatInches } from "@/lib/kdpSizes";

export const metadata = {
  title: "KDP wireframes",
  description: "Unbranded paperback interior wireframes.",
};

export default function KdpIndexPage() {
  const books = loadBooks();

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">KDP wireframes</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Grayscale interior templates for logbooks, journals, and cheat-sheet books. No logos, brand colors, or
        marketing copy. Print-ready PDFs are built with <code className="text-sm">npm run book-pdf</code>.
      </p>
      {books.length === 0 ? (
        <p className="mt-6 text-neutral-600">No books yet. Add a manifest under kdp/.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const title = book.manifest?.kdp.title ?? book.id;
            const trim = book.manifest ? TRIM_SPECS[book.manifest.trim] : null;
            return (
              <li key={book.id}>
                <Link
                  href={`/kdp/${book.id}`}
                  className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
                >
                  <h2 className="font-semibold text-neutral-900">{title}</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {book.manifest
                      ? `${book.manifest.format} · ${trim?.label ?? book.manifest.trim} · ${book.geometry ? pageCountLabel(book.geometry.pageCount) : "not ready"}`
                      : "Manifest needs fixes"}
                  </p>
                  {book.geometry ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Bleed page {formatInches(book.geometry.pageWidthIn)} × {formatInches(book.geometry.pageHeightIn)} ·
                      gutter {formatInches(book.geometry.gutterIn)}
                    </p>
                  ) : null}
                  {book.errors.length > 0 ? (
                    <p className="mt-2 text-xs text-neutral-700">{book.errors[0]}</p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
