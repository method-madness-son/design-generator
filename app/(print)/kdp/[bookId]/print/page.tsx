import { notFound } from "next/navigation";
import { BookSheet } from "@/components/kdp/BookSheet";
import { getBookIds, loadBook } from "@/lib/kdpBooks";

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return {
    title: book?.manifest ? `${book.manifest.kdp.title} — print sheets` : "KDP print sheets",
    robots: { index: false, follow: false },
  };
}

export default async function KdpPrintPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();

  if (!book.manifest || !book.geometry || book.errors.length > 0) {
    return (
      <div data-kdp-error="1" className="p-6 text-sm text-neutral-900">
        <h1 className="text-lg font-semibold">Cannot print {book.id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {book.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const { geometry, manifest } = book;

  return (
    <div
      data-kdp-ready="1"
      data-book-id={manifest.id}
      data-page-width-pt={geometry.pageWidthPt}
      data-page-height-pt={geometry.pageHeightPt}
      data-page-width-px={geometry.pageWidthPx}
      data-page-height-px={geometry.pageHeightPx}
      style={{ width: geometry.pageWidthPx }}
    >
      {book.pages.map((page, index) => (
        <BookSheet
          key={index + 1}
          manifest={manifest}
          page={page}
          pageNumber={index + 1}
          geometry={geometry}
          mode="print"
        />
      ))}
    </div>
  );
}
