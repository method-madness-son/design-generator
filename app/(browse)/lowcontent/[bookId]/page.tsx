import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CoverSheet } from '@/components/lowcontent/CoverSheet';
import { coverConceptFor } from '@/components/lowcontent/NdCover';
import { devDesignFor } from '@/components/lowcontent/DevCover';
import { InteriorSheet } from '@/components/lowcontent/InteriorSheet';
import { LcDownloadPackButton } from '@/components/lowcontent/LcDownloadPackButton';
import { ScaledSheet } from '@/components/lowcontent/ScaledSheet';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';
import { savedElements } from '@/lib/lowcontent/exports';
import { inchesToPixels, formatInches, type InteriorGeometry } from '@/lib/lowcontent/specs';
import type { LowContentManifest, RenderedLcPage, ResolvedInteriorTheme, LcOutlineEntry } from '@/types/lowcontent';

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return { title: book?.manifest ? `${book.manifest.title} — low-content preview` : 'Low-content preview' };
}

function uniqueTemplatePages(pages: RenderedLcPage[]): RenderedLcPage[] {
  const seen = new Set<string>();
  const result: RenderedLcPage[] = [];
  for (const page of pages) {
    if (!seen.has(page.template)) {
      seen.add(page.template);
      result.push(page);
    }
  }
  return result;
}

export default async function LowContentBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();
  const { manifest, geometry, cover, theme, pages, outline } = book;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Breadcrumbs items={[{ label: "KDP", href: "/kdp" }, { label: manifest?.title ?? book.id }]} />
        {manifest ? (
          <>
            <Link href={`/lowcontent/${book.id}/print`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Interior sheets
            </Link>
            <Link href={`/lowcontent/${book.id}/cover`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Cover file
            </Link>
            <LcDownloadPackButton bookId={book.id} bookTitle={manifest.title} savedElements={savedElements(book.id)} />
          </>
        ) : null}
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{manifest?.title ?? book.id}</h1>
      {manifest ? <p className="mt-1 max-w-2xl text-neutral-600">{manifest.subtitle}</p> : null}
      <MessageList items={book.errors} tone="error" />
      <MessageList items={book.warnings} tone="warn" />
      {manifest && geometry && cover && theme ? (
        <>
          {/* ── Thumbnail grid ── */}
          <h2 className="mt-6 text-lg font-semibold">Design</h2>
          <p className="mt-1 text-sm text-neutral-500">Click a thumbnail to open the designer for that element.</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {/* Front cover */}
            <Thumbnail
              label="Front cover"
              href={`/lowcontent/${book.id}/design/front-cover`}
            >
              <ScaledSheet widthPx={inchesToPixels(cover.trimWidthIn)} heightPx={inchesToPixels(cover.trimHeightIn)} displayWidth={140}>
                <CoverSheet
                  title={manifest.title}
                  subtitle={manifest.subtitle}
                  description={manifest.kdp.description}
                  pageCount={manifest.pageCount}
                  geometry={cover}
                  theme={theme}
                  mode="preview"
                  variant="front"
                  concept={coverConceptFor(manifest.id, undefined)}
                  devDesign={manifest.id === 'dev-notebook' ? devDesignFor(undefined) : undefined}
                />
              </ScaledSheet>
            </Thumbnail>

            {/* Back cover */}
            <Thumbnail
              label="Back cover"
              href={`/lowcontent/${book.id}/design/back-cover`}
            >
              <BackCoverThumb
                manifest={manifest}
                cover={cover}
                theme={theme}
              />
            </Thumbnail>

            {/* Interior page templates */}
            {uniqueTemplatePages(pages).map((page) => (
              <Thumbnail
                key={page.template}
                label={page.config.heading || page.template}
                href={`/lowcontent/${book.id}/design/${page.template}`}
              >
                <ScaledSheet widthPx={geometry.pageWidthPx} heightPx={geometry.pageHeightPx} displayWidth={140}>
                  <InteriorSheet
                    title={manifest.title}
                    subtitle={manifest.subtitle}
                    page={page}
                    outline={outline}
                    geometry={geometry}
                    theme={theme}
                    mode="preview"
                    monochrome={manifest.ink === 'black'}
                  />
                </ScaledSheet>
              </Thumbnail>
            ))}
          </div>

          {/* ── Specs ── */}
          <dl className="mt-8 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
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

          {/* ── Full cover ── */}
          <ul className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-500">
            <li>Solid line: trim</li>
            <li>Dashed line: safe zone</li>
            <li>Blue line: spine</li>
            <li>Barcode box: preview only</li>
          </ul>
          <h2 className="mt-4 text-lg font-semibold">Full wrap cover</h2>
          <div className="mt-3 inline-block bg-neutral-200 p-3">
            <ScaledSheet widthPx={cover.fullWidthPx} heightPx={cover.fullHeightPx} displayWidth={720}>
              <CoverSheet
                title={manifest.title}
                subtitle={manifest.subtitle}
                description={manifest.kdp.description}
                pageCount={manifest.pageCount}
                geometry={cover}
                theme={theme}
                mode="preview"
                variant="wrap"
                concept={coverConceptFor(manifest.id, undefined)}
                devDesign={manifest.id === 'dev-notebook' ? devDesignFor(undefined) : undefined}
              />
            </ScaledSheet>
          </div>

          {/* ── Interior pages ── */}
          {pages.length > 40 ? (
            <ContactSheet pages={pages} manifest={manifest} geometry={geometry} theme={theme} outline={outline} />
          ) : (
            <>
              <h2 className="mt-8 text-lg font-semibold">Interior spreads</h2>
              <div className="mt-3 space-y-6">
                {pairPages(pages).map((pair) => (
                  <div key={pair[0].pageNumber} className="flex flex-wrap gap-3 bg-neutral-200 p-3">
                    {pair.map((page) => (
                      <ScaledSheet key={page.pageNumber} widthPx={geometry.pageWidthPx} heightPx={geometry.pageHeightPx} displayWidth={320}>
                        <InteriorSheet
                          title={manifest.title}
                          subtitle={manifest.subtitle}
                          page={page}
                          outline={outline}
                          geometry={geometry}
                          theme={theme}
                          mode="preview"
                          monochrome={manifest.ink === 'black'}
                        />
                      </ScaledSheet>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </>
  );
}

function Thumbnail({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-1.5">
      <div className="overflow-hidden rounded border border-neutral-300 bg-neutral-200 p-1.5 transition-all group-hover:border-neutral-500 group-hover:shadow-md">
        {children}
      </div>
      <span className="max-w-[140px] truncate text-xs font-medium text-neutral-600 group-hover:text-neutral-900">{label}</span>
    </Link>
  );
}

function BackCoverThumb({
  manifest,
  cover,
  theme,
}: {
  manifest: LowContentManifest;
  cover: NonNullable<ReturnType<typeof loadBook>>['cover'] & {};
  theme: ResolvedInteriorTheme;
}) {
  const widthPx = inchesToPixels(cover.trimWidthIn);
  const heightPx = inchesToPixels(cover.trimHeightIn);
  return (
    <ScaledSheet widthPx={widthPx} heightPx={heightPx} displayWidth={140}>
      <div style={{ position: 'relative', width: widthPx, height: heightPx, background: theme.paper, color: theme.ink, fontFamily: theme.supportingFontCss }}>
        <div style={{ position: 'absolute', left: widthPx * 0.08, top: heightPx * 0.08, right: widthPx * 0.08, bottom: heightPx * 0.3 }}>
          <p style={{ margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: heightPx * 0.015 }}>{manifest.title}</p>
          <p style={{ margin: `${heightPx * 0.02}px 0 0`, fontSize: heightPx * 0.013, lineHeight: 1.35 }}>{manifest.kdp.description}</p>
          <p style={{ margin: `${heightPx * 0.025}px 0 0`, fontSize: heightPx * 0.011 }}>{manifest.pageCount} write-in pages</p>
        </div>
      </div>
    </ScaledSheet>
  );
}

function ContactSheet({
  pages,
  manifest,
  geometry,
  theme,
  outline,
}: {
  pages: RenderedLcPage[];
  manifest: LowContentManifest;
  geometry: InteriorGeometry;
  theme: ResolvedInteriorTheme;
  outline: LcOutlineEntry[];
}) {
  const groups: { label: string; pages: RenderedLcPage[] }[] = [];
  for (const page of pages) {
    const label = page.config.heading || page.template;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.pages.push(page);
    else groups.push({ label, pages: [page] });
  }
  return (
    <div data-contact-sheet="1">
      <h2 className="mt-8 text-lg font-semibold">Pages</h2>
      <p className="mt-1 text-sm text-neutral-600">Every interior page, in order. Thumbnails are the print pages.</p>
      {groups.map((group) => (
        <section key={`${group.label}-${group.pages[0].pageNumber}`} className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-800">
            {group.label}{' '}
            <span className="font-normal text-neutral-500">
              p. {group.pages[0].pageNumber}
              {group.pages.length > 1 ? `–${group.pages[group.pages.length - 1].pageNumber}` : ''}
            </span>
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 bg-neutral-200 p-3">
            {group.pages.map((page) => (
              <ScaledSheet key={page.pageNumber} widthPx={geometry.pageWidthPx} heightPx={geometry.pageHeightPx} displayWidth={150}>
                <InteriorSheet
                  title={manifest.title}
                  subtitle={manifest.subtitle}
                  page={page}
                  outline={outline}
                  geometry={geometry}
                  theme={theme}
                  mode="print"
                  monochrome={manifest.ink === 'black'}
                />
              </ScaledSheet>
            ))}
          </div>
        </section>
      ))}
    </div>
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
