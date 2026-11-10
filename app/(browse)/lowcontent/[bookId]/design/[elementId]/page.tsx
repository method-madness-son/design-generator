import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CoverSheet } from '@/components/lowcontent/CoverSheet';
import { coverConceptFor } from '@/components/lowcontent/NdCover';
import { devDesignFor, DEV_DESIGNS } from '@/components/lowcontent/DevCover';
import { InteriorSheet } from '@/components/lowcontent/InteriorSheet';
import { ScaledSheet } from '@/components/lowcontent/ScaledSheet';
import { LcDesignControls } from '@/components/lowcontent/LcDesignControls';
import { LcSaveButton } from '@/components/lowcontent/LcSaveButton';
import { getBookIds, loadBook } from '@/lib/lowcontent/books';
import { savedElements, savedLcSelection } from '@/lib/lowcontent/exports';
import { getProject, getResolvedPoster } from '@/lib/posterResolver';
import { inchesToPixels, scaleX, scaleY, type CoverGeometry } from '@/lib/lowcontent/specs';
import { GLOBAL_FONTS } from '@/lib/fontOptions';
import type { RenderedLcPage, ResolvedInteriorTheme, LcOutlineEntry } from '@/types/lowcontent';

export function generateStaticParams() {
  const elements = ['front-cover', 'back-cover', 'title', 'belongs-to', 'contents', 'lined', 'dot-grid', 'graph',
    'weekly-planner', 'monthly-planner', 'habit-tracker', 'gratitude', 'stats-tracker', 'recipe',
    'meal-planner', 'logbook', 'dopamine-menu', 'brain-dump', 'daily-plan', 'weekly-overview',
    'weekly-reset', 'fresh-start', 'sort-page', 'urgent-important', 'project-planner',
    'appointments', 'tiny-step', 'parking-lot', 'launch-shutdown', 'day-routine', 'low-energy',
    'decision-helper', 'body-double', 'task-reward', 'quick-start', 'monthly-review',
    'habit-tracker', 'mood-sleep', 'focus-log', 'wins-list'];
  return getBookIds().flatMap((bookId) => elements.map((elementId) => ({ bookId, elementId })));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string; elementId: string }> }) {
  const { bookId, elementId } = await params;
  const book = loadBook(bookId);
  const label = elementId.replace(/-/g, ' ');
  return { title: book?.manifest ? `${label} — ${book.manifest.title}` : `${label} — design` };
}

function applyOverrides(
  theme: ResolvedInteriorTheme,
  searchParams: Record<string, string | string[] | undefined>,
): ResolvedInteriorTheme {
  const get = (key: string) => {
    const val = searchParams[key];
    return typeof val === 'string' && val.trim() ? val.trim() : undefined;
  };
  const displayFont = get('displayFont');
  const supportingFont = get('supportingFont');
  const ink = get('ink');
  const accent = get('accent');
  const paper = get('paper');

  return {
    ...theme,
    ...(displayFont && GLOBAL_FONTS[displayFont]
      ? { displayFont, displayFontCss: GLOBAL_FONTS[displayFont] }
      : {}),
    ...(supportingFont && GLOBAL_FONTS[supportingFont]
      ? { supportingFont, supportingFontCss: GLOBAL_FONTS[supportingFont] }
      : {}),
    ...(ink ? { ink } : {}),
    ...(accent ? { accent } : {}),
    ...(paper ? { paper } : {}),
  };
}

export default async function LcDesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string; elementId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookId, elementId } = await params;
  const query = await searchParams;
  const book = loadBook(bookId);
  if (!book) notFound();
  const { manifest, geometry, cover, theme: baseTheme, pages, outline } = book;
  if (!manifest || !geometry || !cover || !baseTheme) notFound();

  const theme = applyOverrides(baseTheme, query);
  const variant = typeof query.variant === 'string' ? query.variant : undefined;

  const currentQuery: Record<string, string> = {};
  for (const [key, val] of Object.entries(query)) {
    if (typeof val === 'string' && val) currentQuery[key] = val;
  }

  const isCover = elementId === 'front-cover' || elementId === 'back-cover';
  const printWidthPx = isCover ? inchesToPixels(cover.trimWidthIn) : geometry.pageWidthPx;
  const printHeightPx = isCover ? inchesToPixels(cover.trimHeightIn) : geometry.pageHeightPx;
  const alreadySaved = savedElements(bookId);
  const previewNodeId = `lc-preview-${elementId}`;

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {/* Controls panel */}
      <div className="lg:w-80 lg:shrink-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Breadcrumbs items={[
            { label: 'KDP', href: '/kdp' },
            { label: manifest.title, href: `/lowcontent/${bookId}` },
            { label: elementId.replace(/-/g, ' ') },
          ]} />
        </div>
        <div className="mt-3">
          <LcDesignControls
            displayFont={currentQuery.displayFont ?? ''}
            supportingFont={currentQuery.supportingFont ?? ''}
            ink={currentQuery.ink ?? ''}
            accent={currentQuery.accent ?? ''}
            paper={currentQuery.paper ?? ''}
            variant={variant ?? ''}
            elementId={elementId}
            bookId={bookId}
            defaultDisplayFont={baseTheme.displayFont}
            defaultSupportingFont={baseTheme.supportingFont}
            defaultInk={baseTheme.ink}
            defaultAccent={baseTheme.accent}
            defaultPaper={baseTheme.paper}
          />
        </div>
        <div className="mt-3">
          <LcSaveButton
            elementId={elementId}
            bookId={bookId}
            previewNodeId={previewNodeId}
            widthPx={printWidthPx}
            heightPx={printHeightPx}
            selection={currentQuery}
            saved={alreadySaved.includes(elementId)}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 lg:mt-0 lg:min-w-0 lg:flex-1">
        <div id={previewNodeId} className="inline-block rounded-lg bg-neutral-200 p-3">
          <ElementPreview
            elementId={elementId}
            manifest={manifest}
            geometry={geometry}
            cover={cover}
            theme={theme}
            pages={pages}
            outline={outline}
            variant={variant}
            bookId={bookId}
          />
        </div>
      </div>
    </div>
  );
}

function ElementPreview({
  elementId,
  manifest,
  geometry,
  cover,
  theme,
  pages,
  outline,
  variant,
  bookId,
}: {
  elementId: string;
  manifest: NonNullable<ReturnType<typeof loadBook>>['manifest'] & {};
  geometry: NonNullable<ReturnType<typeof loadBook>>['geometry'] & {};
  cover: NonNullable<ReturnType<typeof loadBook>>['cover'] & {};
  theme: ResolvedInteriorTheme;
  pages: RenderedLcPage[];
  outline: LcOutlineEntry[];
  variant: string | undefined;
  bookId: string;
}) {
  if (elementId === 'front-cover') {
    const widthPx = inchesToPixels(cover.trimWidthIn);
    const heightPx = inchesToPixels(cover.trimHeightIn);
    return (
      <ScaledSheet widthPx={widthPx} heightPx={heightPx} displayWidth={480}>
        <CoverSheet
          title={manifest.title}
          subtitle={manifest.subtitle}
          description={manifest.kdp.description}
          pageCount={manifest.pageCount}
          geometry={cover}
          theme={theme}
          mode="preview"
          variant="front"
          concept={coverConceptFor(manifest.id, variant)}
          devDesign={bookId === 'dev-notebook' ? devDesignFor(variant) : undefined}
        />
      </ScaledSheet>
    );
  }

  if (elementId === 'back-cover') {
    const widthPx = inchesToPixels(cover.trimWidthIn);
    const heightPx = inchesToPixels(cover.trimHeightIn);
    const sx = (inches: number) => scaleX(cover.trimWidthIn, widthPx, inches);
    const sy = (inches: number) => scaleY(cover.trimHeightIn, heightPx, inches);
    return (
      <ScaledSheet widthPx={widthPx} heightPx={heightPx} displayWidth={480}>
        <div style={{ position: 'relative', width: widthPx, height: heightPx, background: theme.paper, color: theme.ink, fontFamily: theme.supportingFontCss }}>
          <div style={{ position: 'absolute', left: sx(0.5), top: sy(0.5), right: sx(0.5), bottom: sy(2.5) }}>
            <p style={{ margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: sy(0.018) }}>{manifest.title}</p>
            <p style={{ margin: `${sy(0.03)}px 0 0`, fontSize: sy(0.016), lineHeight: 1.35 }}>{manifest.kdp.description}</p>
            <p style={{ margin: `${sy(0.035)}px 0 0`, fontSize: sy(0.014) }}>{manifest.pageCount} write-in pages</p>
          </div>
          <div style={{
            position: 'absolute',
            left: sx(cover.trimWidthIn - 2.5),
            bottom: sy(0.5),
            width: sx(2),
            height: sy(1.2),
            background: '#ffffff',
            border: '2px dashed #b91c1c',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: sy(0.04),
            fontSize: sy(0.012),
            color: '#b91c1c',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>Barcode</div>
        </div>
      </ScaledSheet>
    );
  }

  const page = pages.find((p) => p.template === elementId);
  if (!page) notFound();
  return (
    <ScaledSheet widthPx={geometry.pageWidthPx} heightPx={geometry.pageHeightPx} displayWidth={480}>
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
  );
}
