import type { CSSProperties } from 'react';
import { pageKindLabel } from '@/lib/kdpBooks';
import { insetsPx, safeInsetsIn, scaleX, scaleY, type BookGeometry } from '@/lib/kdpSizes';
import type { BookManifest, RenderedPage } from '@/types/kdp';

const INK = '#171717';
const MUTED = '#525252';
const LINE = '#737373';
const HAIRLINE = '#c4c4c4';
const HEADER_FILL = '#e5e5e5';
const BLEED_FILL = '#d4d4d4';
const PAPER = '#ffffff';

type SheetProps = {
  manifest: BookManifest;
  page: RenderedPage;
  pageNumber: number;
  geometry: BookGeometry;
  mode: 'print' | 'preview';
};

function pt(points: number, geometry: BookGeometry): number {
  return (points / 72) * (geometry.pageHeightPx / geometry.pageHeightIn);
}

export function BookSheet({ manifest, page, pageNumber, geometry, mode }: SheetProps) {
  const odd = pageNumber % 2 === 1;
  const insets = insetsPx(geometry, safeInsetsIn(geometry, odd));
  const trimLeft = scaleX(geometry, odd ? 0 : geometry.bleedIn);
  const trimTop = scaleY(geometry, geometry.bleedIn);
  const trimWidth = scaleX(geometry, geometry.trimWidthIn);
  const trimHeight = scaleY(geometry, geometry.trimHeightIn);

  return (
    <article
      data-kdp-page={mode === 'print' ? pageNumber : undefined}
      data-odd={odd ? '1' : '0'}
      data-width-px={geometry.pageWidthPx}
      data-height-px={geometry.pageHeightPx}
      style={{
        position: 'relative',
        width: geometry.pageWidthPx,
        height: geometry.pageHeightPx,
        background: BLEED_FILL,
        overflow: 'hidden',
        color: INK,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: trimLeft,
          top: trimTop,
          width: trimWidth,
          height: trimHeight,
          background: PAPER,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: insets.left,
          top: insets.top,
          right: insets.right,
          bottom: insets.bottom,
          display: 'flex',
          flexDirection: 'column',
          gap: pt(6, geometry),
          outline: `1px dashed ${HAIRLINE}`,
          outlineOffset: -1,
          padding: pt(4, geometry),
          minWidth: 0,
        }}
      >
        <RunningHeader manifest={manifest} page={page} geometry={geometry} />
        <PageBody manifest={manifest} page={page} geometry={geometry} />
        <footer
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: odd ? 'flex-end' : 'flex-start',
            fontSize: pt(8, geometry),
            color: MUTED,
          }}
        >
          {pageNumber}
        </footer>
      </div>
    </article>
  );
}

function RunningHeader({
  manifest,
  page,
  geometry,
}: {
  manifest: BookManifest;
  page: RenderedPage;
  geometry: BookGeometry;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: pt(8, geometry),
        fontSize: pt(8, geometry),
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: MUTED,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Wireframe · {manifest.kdp.title}
      </span>
      <span style={{ flexShrink: 0 }}>{pageKindLabel(page)}</span>
    </div>
  );
}

function PageBody({
  manifest,
  page,
  geometry,
}: {
  manifest: BookManifest;
  page: RenderedPage;
  geometry: BookGeometry;
}) {
  switch (page.type) {
    case 'title':
      return <TitleBody manifest={manifest} page={page} geometry={geometry} />;
    case 'copyright':
      return <CopyrightBody page={page} geometry={geometry} />;
    case 'log':
      return <LogBody page={page} geometry={geometry} />;
    case 'stats':
      return <StatsBody page={page} geometry={geometry} />;
    case 'notes':
      return <NotesBody page={page} geometry={geometry} />;
    case 'cheatsheet':
      return <CheatSheetBody page={page} geometry={geometry} />;
    case 'checklist':
      return <ChecklistBody page={page} geometry={geometry} />;
    case 'paper':
      return <PaperBody page={page} geometry={geometry} />;
    case 'habit':
      return <HabitBody page={page} geometry={geometry} />;
    default: {
      const unreachable: never = page;
      return unreachable;
    }
  }
}

function TitleBody({
  manifest,
  page,
  geometry,
}: {
  manifest: BookManifest;
  page: Extract<RenderedPage, { type: 'title' }>;
  geometry: BookGeometry;
}) {
  const title = page.title ?? manifest.kdp.title;
  const subtitle = page.subtitle ?? manifest.kdp.subtitle;
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: pt(10, geometry),
      }}
    >
      <div style={{ fontSize: pt(9, geometry), letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED }}>
        {page.kicker ?? 'Placeholder title page'}
      </div>
      <div style={{ fontSize: pt(26, geometry), fontWeight: 650, lineHeight: 1.1 }}>{title}</div>
      {subtitle ? (
        <div style={{ fontSize: pt(13, geometry), color: MUTED, maxWidth: '80%' }}>{subtitle}</div>
      ) : null}
      <div style={{ width: '28%', borderTop: `1px solid ${INK}`, margin: `${pt(6, geometry)}px 0` }} />
      <div style={{ fontSize: pt(10, geometry), color: MUTED, maxWidth: '78%', lineHeight: 1.4 }}>
        {page.note ?? 'No cover art, logo, or brand color in this file. Replace this text before listing.'}
      </div>
    </div>
  );
}

function CopyrightBody({
  page,
  geometry,
}: {
  page: Extract<RenderedPage, { type: 'copyright' }>;
  geometry: BookGeometry;
}) {
  const notices = page.notices ?? [
    'Placeholder notice. This page is not a real copyright registration.',
    'No imprint, ISBN, logo, or brand name is assigned in this wireframe.',
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: pt(8, geometry) }}>
      <SectionLabel geometry={geometry}>Copyright page</SectionLabel>
      <div style={{ fontSize: pt(11, geometry), lineHeight: 1.45 }}>
        {page.year ?? '2026'} · {page.holder ?? '[Rights holder placeholder]'}
      </div>
      {notices.map((notice) => (
        <p key={notice} style={{ margin: 0, fontSize: pt(9, geometry), lineHeight: 1.45, color: MUTED }}>
          {notice}
        </p>
      ))}
    </div>
  );
}

function LogBody({ page, geometry }: { page: Extract<RenderedPage, { type: 'log' }>; geometry: BookGeometry }) {
  const heading = page.heading ?? (page.dated ? 'Placeholder dated log' : 'Placeholder undated log');
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>{page.dated ? 'Dated log' : 'Undated log'}</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{heading}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder entry {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: pt(4, geometry) }}>
        {page.fields.map((field) => (
          <div key={field.label}>
            <div style={{ fontSize: pt(8, geometry), color: MUTED }}>{field.label}</div>
            {Array.from({ length: field.lines ?? 1 }, (_, line) => (
              <div
                key={line}
                style={{
                  height: pt(14, geometry),
                  borderBottom: `1px solid ${LINE}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {page.grid ? (
        <RuledTable
          geometry={geometry}
          caption="Placeholder grid"
          columns={page.grid.columns}
          rows={page.grid.rows}
        />
      ) : null}
    </div>
  );
}

function StatsBody({ page, geometry }: { page: Extract<RenderedPage, { type: 'stats' }>; geometry: BookGeometry }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>Stats tracker</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? 'Placeholder stats'}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder sheet {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <RuledTable geometry={geometry} caption="Placeholder table — blank write-in cells" columns={page.columns} rows={page.rows} />
    </div>
  );
}

function NotesBody({ page, geometry }: { page: Extract<RenderedPage, { type: 'notes' }>; geometry: BookGeometry }) {
  const line = pt(16, geometry);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>Notes page</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? 'Placeholder notes'}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder page {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          border: `1px solid ${LINE}`,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${line - 1}px, ${HAIRLINE} ${line - 1}px, ${HAIRLINE} ${line}px)`,
        }}
      />
    </div>
  );
}

function CheatSheetBody({
  page,
  geometry,
}: {
  page: Extract<RenderedPage, { type: 'cheatsheet' }>;
  geometry: BookGeometry;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>Cheat-sheet page</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? 'Placeholder cheat sheet'}</div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: page.sections.length > 1 ? '1fr 1fr' : '1fr',
          gap: pt(8, geometry),
          alignContent: 'start',
        }}
      >
        {page.sections.map((section) => (
          <section key={section.title} style={{ border: `1px solid ${LINE}`, padding: pt(6, geometry), minWidth: 0 }}>
            <div
              style={{
                fontSize: pt(10, geometry),
                fontWeight: 650,
                borderBottom: `1px solid ${INK}`,
                paddingBottom: pt(3, geometry),
                marginBottom: pt(3, geometry),
              }}
            >
              {section.title}
            </div>
            {section.rows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: pt(6, geometry),
                  borderBottom: `1px solid ${HAIRLINE}`,
                  fontSize: pt(8, geometry),
                  padding: `${pt(3, geometry)}px 0`,
                }}
              >
                <span>{row.label}</span>
                <span style={{ color: MUTED, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function ChecklistBody({
  page,
  geometry,
}: {
  page: Extract<RenderedPage, { type: 'checklist' }>;
  geometry: BookGeometry;
}) {
  const box = pt(9, geometry);
  const stroke = rulePx(geometry);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>Checklist</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? 'Placeholder checklist'}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder list {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: pt(5, geometry) }}>
        {page.items.map((item, index) => (
          <div key={`${item}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: pt(6, geometry) }}>
            <div
              style={{
                width: box,
                height: box,
                border: `${stroke}px solid ${INK}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: pt(10, geometry), lineHeight: 1.3 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaperBody({
  page,
  geometry,
}: {
  page: Extract<RenderedPage, { type: 'paper' }>;
  geometry: BookGeometry;
}) {
  const label = page.style === 'lined' ? 'Lined page' : page.style === 'dot' ? 'Dot-grid page' : 'Square-grid page';
  const spacing = scaleX(geometry, 0.25);
  const stroke = rulePx(geometry);
  const pattern =
    page.style === 'lined'
      ? {
          image: `repeating-linear-gradient(to bottom, transparent, transparent ${spacing - stroke}px, ${LINE} ${spacing - stroke}px, ${LINE} ${spacing}px)`,
          size: undefined,
        }
      : page.style === 'dot'
        ? {
            image: `radial-gradient(circle, ${LINE} ${Math.max(1.5, stroke * 0.45)}px, transparent ${Math.max(1.6, stroke * 0.5)}px)`,
            size: `${spacing}px ${spacing}px`,
          }
        : {
            image: `linear-gradient(to right, ${LINE} ${stroke}px, transparent ${stroke}px), linear-gradient(to bottom, ${LINE} ${stroke}px, transparent ${stroke}px)`,
            size: `${spacing}px ${spacing}px`,
          };
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>{label}</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? label}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder page {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: `${stroke}px solid ${LINE}`,
          backgroundImage: pattern.image,
          backgroundSize: pattern.size,
        }}
      />
    </div>
  );
}

function HabitBody({
  page,
  geometry,
}: {
  page: Extract<RenderedPage, { type: 'habit' }>;
  geometry: BookGeometry;
}) {
  const stroke = rulePx(geometry);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(6, geometry) }}>
      <SectionLabel geometry={geometry}>Habit tracker</SectionLabel>
      <div style={{ fontSize: pt(14, geometry), fontWeight: 650 }}>{page.heading ?? 'Placeholder habit tracker'}</div>
      {page.entryCount > 1 ? (
        <div style={{ fontSize: pt(8, geometry), color: MUTED }}>
          Placeholder week {page.entryIndex} of {page.entryCount}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1.7fr) repeat(${page.days}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${page.habits.length}, minmax(0, 1fr))`,
          borderTop: `${stroke}px solid ${LINE}`,
          borderLeft: `${stroke}px solid ${LINE}`,
        }}
      >
        <div style={habitHeaderStyle(geometry, stroke)}>Habit</div>
        {Array.from({ length: page.days }, (_, day) => (
          <div key={`day-${day}`} style={{ ...habitHeaderStyle(geometry, stroke), textAlign: 'center' }}>
            {day + 1}
          </div>
        ))}
        {page.habits.flatMap((habit, row) => [
          <div
            key={`${row}-label`}
            style={{
              borderRight: `${stroke}px solid ${HAIRLINE}`,
              borderBottom: `${stroke}px solid ${HAIRLINE}`,
              padding: pt(3, geometry),
              fontSize: pt(8, geometry),
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            {habit}
          </div>,
          ...Array.from({ length: page.days }, (_, day) => (
            <div
              key={`${row}-${day}`}
              style={{
                borderRight: `${stroke}px solid ${HAIRLINE}`,
                borderBottom: `${stroke}px solid ${HAIRLINE}`,
              }}
            />
          )),
        ])}
      </div>
    </div>
  );
}

function habitHeaderStyle(geometry: BookGeometry, stroke: number): CSSProperties {
  return {
    background: HEADER_FILL,
    borderRight: `${stroke}px solid ${LINE}`,
    borderBottom: `${stroke}px solid ${LINE}`,
    padding: pt(3, geometry),
    fontSize: pt(8, geometry),
    fontWeight: 650,
  };
}

function rulePx(geometry: BookGeometry): number {
  return Math.max(1, Math.round(pt(0.75, geometry)));
}

function RuledTable({
  geometry,
  caption,
  columns,
  rows,
}: {
  geometry: BookGeometry;
  caption: string;
  columns: string[];
  rows: number;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: pt(3, geometry) }}>
      <div style={{ fontSize: pt(8, geometry), color: MUTED }}>{caption}</div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${rows}, minmax(0, 1fr))`,
          borderTop: `1px solid ${LINE}`,
          borderLeft: `1px solid ${LINE}`,
        }}
      >
        {columns.map((column) => (
          <div
            key={column}
            style={{
              background: HEADER_FILL,
              borderRight: `1px solid ${LINE}`,
              borderBottom: `1px solid ${LINE}`,
              padding: pt(3, geometry),
              fontSize: pt(8, geometry),
              fontWeight: 650,
            }}
          >
            {column}
          </div>
        ))}
        {Array.from({ length: rows * columns.length }, (_, cell) => (
          <div
            key={cell}
            style={{
              borderRight: `1px solid ${HAIRLINE}`,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children, geometry }: { children: string; geometry: BookGeometry }) {
  return (
    <div style={{ fontSize: pt(8, geometry), letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
      {children}
    </div>
  );
}

export function pageCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'page' : 'pages'}`;
}
