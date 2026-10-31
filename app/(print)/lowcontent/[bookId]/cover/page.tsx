import { notFound } from 'next/navigation';
import { CoverSheet } from '@/components/lowcontent/CoverSheet';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return {
    title: book?.manifest ? `${book.manifest.title} — cover` : 'Low-content cover',
    robots: { index: false, follow: false },
  };
}

export default async function LowContentCoverPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();
  if (!book.manifest || !book.cover || !book.theme || book.errors.length > 0) {
    return (
      <div data-lc-error="1" className="p-6 text-sm">
        <h1 className="text-lg font-semibold">Cannot print cover {book.id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {book.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
  const { manifest, cover, theme } = book;
  return (
    <div data-lc-cover-ready="1" style={{ width: cover.fullWidthPx, height: cover.fullHeightPx }}>
      <CoverSheet
        title={manifest.title}
        subtitle={manifest.subtitle}
        description={manifest.kdp.description}
        pageCount={manifest.pageCount}
        geometry={cover}
        theme={theme}
        mode="print"
        variant="wrap"
      />
    </div>
  );
}
