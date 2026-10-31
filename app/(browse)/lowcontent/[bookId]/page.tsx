import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CoverSheet } from '@/components/lowcontent/CoverSheet';
import { InteriorSheet } from '@/components/lowcontent/InteriorSheet';
import { ScaledSheet } from '@/components/lowcontent/ScaledSheet';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';
import { formatInches } from '@/lib/lowcontent/specs';

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return { title: book?.manifest ? `${book.manifest.title} — low-content preview` : 'Low-content preview' };
}

export default async function LowContentBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();
  const { manifest, geometry, cover, theme, pages, outline } = book;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/lowcontent" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Low-content books
        </Link>
        {manifest ? (
          <>
            <Link href={`/lowcontent/${book.id}/print`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Interior sheets
            </Link>
            <Link href={`/lowcontent/${book.id}/cover`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Cover file
            </Link>
          </>
        ) : null}
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{manifest?.title ?? book.id}</h1>
      {manifest ? <p className="mt-1 max-w-2xl text-neutral-600">{manifest.subtitle}</p> : null}
      <MessageList items={book.errors} tone="error" />
      <MessageList items={book.warnings} tone="warn" />
      {manifest && geometry && cover && theme ? (
        <>
          <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Spec term="Project" value={manifest.project} />
            <Spec term="Trim" value={`${geometry.trim.label}${geometry.largeTrim ? ' · large trim' : ''}`} />
            <Spec term="Pages" value={String(geometry.pageCount)} />
            <Spec term="Paper / ink" value={`${manifest.paper} / ${manifest.ink}`} />
            <Spec term="Gutter" value={`${formatInches(geometry.gutterIn)} from the trim`} />
            <Spec term="Outside margin" value={`${formatInches(geometry.outsideMarginIn)} from the trim`} />
            <Spec term="Spine" value={`${formatInches(cover.spineIn)} · factor ${cover.spineFactor}`} />
            <Spec term="Cover" value={`${formatInches(cover.fullWidthIn)} × ${formatInches(cover.fullHeightIn)}`} />
            <Spec term="Palette" value={theme.paletteLabel} />
            <Spec term="Fonts" value={`${theme.displayFont} / ${theme.supportingFont}`} />
            <Spec term="ISBN" value={manifest.kdp.isbn === 'none' ? 'Publish without an ISBN' : 'Use my own ISBN'} />
            <Spec term="Price" value={`$${manifest.kdp.priceUsd.toFixed(2)} USD`} />
          </dl>
          <p className="mt-4 max-w-3xl text-sm text-neutral-600">{manifest.kdp.description}</p>
          <ul className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
            <li>Solid line: trim</li>
            <li>Dashed line: safe zone</li>
            <li>Blue line: spine</li>
            <li>Barcode box: preview only</li>
          </ul>
          <h2 className="mt-8 text-lg font-semibold">Cover</h2>
          <div className="mt-3 inline-block bg-neutral-200 p-3">
            <ScaledSheet widthPx={cover.fullWidthPx} heightPx={cover.fullHeightPx} displayWidth={720}>
              <CoverSheet
                kicker={manifest.project}
                title={manifest.title}
                subtitle={manifest.subtitle}
                description={manifest.kdp.description}
                pageCount={manifest.pageCount}
                geometry={cover}
                theme={theme}
                mode="preview"
                variant="wrap"
              />
            </ScaledSheet>
          </div>
          <h2 className="mt-8 text-lg font-semibold">Interior spreads</h2>
          <div className="mt-3 space-y-6">
            {pairPages(pages).map((pair) => (
              <div key={pair[0].pageNumber} className="flex flex-wrap gap-3 bg-neutral-200 p-3">
                {pair.map((page) => (
                  <ScaledSheet key={page.pageNumber} widthPx={geometry.pageWidthPx} heightPx={geometry.pageHeightPx} displayWidth={320}>
                    <InteriorSheet
                      kicker={manifest.project}
                      title={manifest.title}
                      subtitle={manifest.subtitle}
                      page={page}
                      outline={outline}
                      geometry={geometry}
                      theme={theme}
                      mode="preview"
                    />
                  </ScaledSheet>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

function pairPages<T>(pages: T[]): T[][] {
  const pairs: T[][] = [];
  for (let index = 0; index < pages.length; index += 2) pairs.push(pages.slice(index, index + 2));
  return pairs;
}

function Spec({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{term}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </div>
  );
}

function MessageList({ items, tone }: { items: string[]; tone: 'error' | 'warn' }) {
  if (items.length === 0) return null;
  const className =
    tone === 'error'
      ? 'mt-4 list-disc space-y-1 rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-800'
      : 'mt-4 list-disc space-y-1 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-700';
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
