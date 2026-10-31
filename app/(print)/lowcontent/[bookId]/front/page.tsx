import { notFound } from 'next/navigation';
import { CoverSheet } from '@/components/lowcontent/CoverSheet';
import { coverConceptFor } from '@/components/lowcontent/NdCover';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';
import { inchesToPixels } from '@/lib/lowcontent/specs';

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return {
    title: book?.manifest ? `${book.manifest.title} — front` : 'Low-content front cover',
    robots: { index: false, follow: false },
  };
}

export default async function LowContentFrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { bookId } = await params;
  const query = await searchParams;
  const book = loadBook(bookId);
  if (!book) notFound();
  if (!book.manifest || !book.cover || !book.theme || book.errors.length > 0) {
    return (
      <div data-lc-error="1" className="p-6 text-sm">
        Cannot render the front cover for {book.id}.
      </div>
    );
  }
  const width = inchesToPixels(book.cover.trimWidthIn);
  const height = inchesToPixels(book.cover.trimHeightIn);
  return (
    <div style={{ width, height }}>
      <CoverSheet
        title={book.manifest.title}
        subtitle={book.manifest.subtitle}
        description={book.manifest.kdp.description}
        pageCount={book.manifest.pageCount}
        geometry={book.cover}
        theme={book.theme}
        mode="print"
        variant="front"
        concept={coverConceptFor(book.id, query.variant)}
      />
    </div>
  );
}
