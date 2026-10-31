import { notFound } from 'next/navigation';
import { InteriorSheet } from '@/components/lowcontent/InteriorSheet';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return {
    title: book?.manifest ? `${book.manifest.title} — interior` : 'Low-content interior',
    robots: { index: false, follow: false },
  };
}

export default async function LowContentPrintPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();
  if (!book.manifest || !book.geometry || !book.theme || book.errors.length > 0) {
    return (
      <div data-lc-error="1" className="p-6 text-sm">
        <h1 className="text-lg font-semibold">Cannot print {book.id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {book.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const { manifest, geometry, theme } = book;
  return (
    <div
      data-lc-ready="1"
      data-book-id={manifest.id}
      data-page-width-px={geometry.pageWidthPx}
      data-page-height-px={geometry.pageHeightPx}
      style={{ width: geometry.pageWidthPx }}
    >
      {book.pages.map((page) => (
        <InteriorSheet
          key={page.pageNumber}
          kicker={manifest.project}
          title={manifest.title}
          subtitle={manifest.subtitle}
          page={page}
          outline={book.outline}
          geometry={geometry}
          theme={theme}
          mode="print"
        />
      ))}
    </div>
  );
}
