import type { CSSProperties } from 'react';
import {
  MIN_FONT_PT,
  MIN_RULE_PT,
  ptToPx,
  safeInsetsIn,
  scaleX,
  scaleY,
  type InteriorGeometry,
} from '@/lib/lowcontent/specs';
import { WEEKDAY_LABELS } from '@/lib/lowcontent/templates';
import type { LcOutlineEntry, RenderedLcPage, ResolvedInteriorTheme } from '@/types/lowcontent';

type SheetProps = {
  title: string;
  subtitle: string;
  page: RenderedLcPage;
  outline: LcOutlineEntry[];
  geometry: InteriorGeometry;
  theme: ResolvedInteriorTheme;
  mode: 'print' | 'preview';
};

type Metrics = {
  x: (inches: number) => number;
  y: (inches: number) => number;
  pt: (points: number) => number;
  rule: number;
};

function metrics(geometry: InteriorGeometry): Metrics {
  return {
    x: (inches) => scaleX(geometry.pageWidthIn, geometry.pageWidthPx, inches),
    y: (inches) => scaleY(geometry.pageHeightIn, geometry.pageHeightPx, inches),
    pt: (points) => ptToPx(geometry.pageHeightIn, geometry.pageHeightPx, points),
    rule: Math.max(ptToPx(geometry.pageHeightIn, geometry.pageHeightPx, MIN_RULE_PT), 1),
  };
}

export function InteriorSheet({ title, subtitle, page, outline, geometry, theme, mode }: SheetProps) {
  const odd = page.pageNumber % 2 === 1;
  const insets = safeInsetsIn(geometry, odd);
  const m = metrics(geometry);
  const trimLeft = m.x(odd ? 0 : geometry.bleedIn);
  const trimTop = m.y(geometry.bleedIn);
  const body: CSSProperties = {
    fontFamily: theme.supportingFontCss,
    color: theme.ink,
    fontSize: m.pt(9),
    lineHeight: 1.25,
  };

  return (
    <article
      data-lc-page={mode === 'print' ? page.pageNumber : undefined}
      data-odd={odd ? '1' : '0'}
      style={{
        position: 'relative',
        width: geometry.pageWidthPx,
        height: geometry.pageHeightPx,
        background: theme.paper,
        overflow: 'hidden',
        ...body,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: m.x(insets.left),
          top: m.y(insets.top),
          right: m.x(insets.right),
          bottom: m.y(insets.bottom),
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Header title={title} page={page} theme={theme} m={m} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PageBody page={page} outline={outline} title={title} subtitle={subtitle} theme={theme} m={m} />
        </div>
        <footer
          style={{
            marginTop: m.pt(6),
            display: 'flex',
            justifyContent: odd ? 'flex-end' : 'flex-start',
            fontSize: m.pt(Math.max(MIN_FONT_PT, 8)),
            letterSpacing: '0.04em',
          }}
        >
          {page.pageNumber}
        </footer>
      </div>
      {mode === 'preview' ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: trimLeft,
              top: trimTop,
              width: m.x(geometry.trim.widthIn),
              height: m.y(geometry.trim.heightIn),
              outline: `${Math.max(m.pt(1.25), 2)}px solid rgba(20, 20, 20, 0.55)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: m.x(insets.left),
              top: m.y(insets.top),
              right: m.x(insets.right),
              bottom: m.y(insets.bottom),
              outline: `${Math.max(m.pt(1), 2)}px dashed rgba(185, 28, 28, 0.85)`,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}
    </article>
  );
}

function Header({
  title,
  page,
  theme,
  m,
}: {
  title: string;
  page: RenderedLcPage;
  theme: ResolvedInteriorTheme;
  m: Metrics;
}) {
  if (page.template === 'title') return null;
  const label = page.entryCount > 1 ? `${page.config.heading} ${page.entryIndex}` : page.config.heading;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: m.pt(8),
        paddingBottom: m.pt(4),
        marginBottom: m.pt(6),
        borderBottom: `${m.rule}px solid ${theme.ink}`,
        fontSize: m.pt(8),
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <span>{label}</span>
      <span>{title}</span>
    </div>
  );
}

function PageBody({
  page,
  outline,
  title,
  subtitle,
  theme,
  m,
}: {
  page: RenderedLcPage;
  outline: LcOutlineEntry[];
  title: string;
  subtitle: string;
  theme: ResolvedInteriorTheme;
  m: Metrics;
}) {
  switch (page.template) {
    case 'title':
      return <TitlePage title={title} subtitle={subtitle} theme={theme} m={m} />;
    case 'belongs-to':
      return <BelongsPage theme={theme} m={m} />;
    case 'contents':
      return <ContentsPage outline={outline} theme={theme} m={m} />;
    case 'weekly-planner':
      return <WeeklyPage page={page} theme={theme} m={m} />;
    case 'monthly-planner':
      return <MonthlyPage page={page} theme={theme} m={m} />;
    case 'habit-tracker':
      return <HabitPage page={page} theme={theme} m={m} />;
    case 'lined':
      return <RuledPage kind="lined" theme={theme} m={m} />;
    case 'dot-grid':
      return <RuledPage kind="dot" theme={theme} m={m} />;
    case 'graph':
      return <RuledPage kind="graph" theme={theme} m={m} />;
    case 'gratitude':
      return <GratitudePage page={page} theme={theme} m={m} />;
    case 'stats-tracker':
      return <StatsPage page={page} theme={theme} m={m} />;
    case 'recipe':
      return <RecipePage theme={theme} m={m} />;
    case 'meal-planner':
      return <MealPage page={page} theme={theme} m={m} />;
    case 'logbook':
      return <LogPage page={page} theme={theme} m={m} />;
    default:
      return null;
  }
}

function TitlePage({
  title,
  subtitle,
  theme,
  m,
}: {
  title: string;
  subtitle: string;
  theme: ResolvedInteriorTheme;
  m: Metrics;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: m.pt(12) }}>
      <div style={{ width: m.pt(36), height: m.rule * 3, background: theme.accent }} />
      <h1 style={{ margin: 0, fontFamily: theme.displayFontCss, fontSize: m.pt(32), lineHeight: 1.05, fontWeight: 400 }}>
        {title}
      </h1>
      <p style={{ margin: 0, fontSize: m.pt(14), maxWidth: '90%' }}>{subtitle}</p>
      <p style={{ margin: 0, fontSize: m.pt(9), letterSpacing: '0.08em', textTransform: 'uppercase' }}>Low-content paperback</p>
    </div>
  );
}

function BelongsPage({ theme, m }: { theme: ResolvedInteriorTheme; m: Metrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: m.pt(18) }}>
      <h2 style={{ margin: 0, fontFamily: theme.displayFontCss, fontSize: m.pt(26), fontWeight: 400 }}>
        This book belongs to
      </h2>
      <Rule theme={theme} m={m} />
      <LabeledLine label="Name" theme={theme} m={m} />
      <LabeledLine label="Started" theme={theme} m={m} />
      <p style={{ margin: 0, fontSize: m.pt(9) }}>Write a name here if you want to. Leave it blank if you do not.</p>
    </div>
  );
}

function ContentsPage({ outline, theme, m }: { outline: LcOutlineEntry[]; theme: ResolvedInteriorTheme; m: Metrics }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m.pt(8) }}>
      {outline.map((entry) => (
        <div key={`${entry.label}-${entry.start}`} style={{ display: 'flex', justifyContent: 'space-between', gap: m.pt(8), borderBottom: `${m.rule}px solid ${theme.rule}`, paddingBottom: m.pt(3) }}>
          <span>{entry.label}</span>
          <span>{entry.start === entry.end ? entry.start : `${entry.start}–${entry.end}`}</span>
        </div>
      ))}
    </div>
  );
}

function WeeklyPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const dated = page.config.dated === true;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: m.pt(6) }}>
      <p style={{ margin: 0, fontSize: m.pt(11) }}>{dated ? 'Week of ______________' : `Week ${page.entryIndex}`}</p>
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', minHeight: 0 }}>
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} style={{ borderTop: `${m.rule}px solid ${theme.ink}`, display: 'flex', gap: m.pt(8), paddingTop: m.pt(3), minHeight: 0 }}>
            <div style={{ width: '22%', fontSize: m.pt(8), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <div>{day}</div>
              {dated ? <div>__/__</div> : null}
            </div>
            <div style={{ flex: 1, borderLeft: `${m.rule}px solid ${theme.rule}` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const dated = page.config.dated === true;
  const cells = dated
    ? Array.from({ length: 35 }, (_, index) => (index < 31 ? String(index + 1) : ''))
    : Array.from({ length: 35 }, (_, index) => (index % 7 === 0 ? `Wk ${Math.floor(index / 7) + 1}` : ''));
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: m.pt(6) }}>
      <p style={{ margin: 0, fontSize: m.pt(11) }}>{dated ? 'Month ______________' : `Month ${page.entryIndex}`}</p>
      {dated ? (
        <p style={{ margin: 0, fontSize: m.pt(8) }}>Dates run in order. They are not pinned to a real weekday.</p>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: m.pt(2) }}>
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} style={{ fontSize: m.pt(7), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', minHeight: 0 }}>
        {cells.map((cell, index) => (
          <div key={index} style={{ borderTop: `${m.rule}px solid ${theme.rule}`, borderLeft: `${m.rule}px solid ${theme.rule}`, padding: m.pt(2), fontSize: m.pt(8) }}>
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const habits = page.config.habits ?? [];
  const days = page.config.days ?? 7;
  const labels = Array.from({ length: days }, (_, index) => String(index + 1));
  return (
    <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={th(theme, m, '28%')}>Habit</th>
          {labels.map((label) => (
            <th key={label} style={th(theme, m)}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {habits.map((habit) => (
          <tr key={habit}>
            <td style={td(theme, m)}>{habit}</td>
            {labels.map((label) => (
              <td key={label} style={td(theme, m)} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GratitudePage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const prompts = page.config.prompts ?? [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(10), minHeight: 0 }}>
      {prompts.map((prompt) => (
        <section key={prompt} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: m.pt(4) }}>
          <h2 style={{ margin: 0, fontSize: m.pt(12), fontFamily: theme.displayFontCss, fontWeight: 400 }}>{prompt}</h2>
          <div style={{ flex: 1, ...lineFill(theme, m) }} />
        </section>
      ))}
    </div>
  );
}

function StatsPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const columns = page.config.columns ?? [];
  const rows = page.config.rows ?? 8;
  return (
    <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} style={th(theme, m)}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {columns.map((column) => (
              <td key={column} style={td(theme, m)} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecipePage({ theme, m }: { theme: ResolvedInteriorTheme; m: Metrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <LabeledLine label="Dish" theme={theme} m={m} />
      <div style={{ display: 'flex', gap: m.pt(12) }}>
        <div style={{ flex: 1 }}><LabeledLine label="Servings" theme={theme} m={m} /></div>
        <div style={{ flex: 1 }}><LabeledLine label="Time" theme={theme} m={m} /></div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: m.pt(10), minHeight: 0 }}>
        <Section title="Ingredients" theme={theme} m={m} />
        <Section title="Steps" theme={theme} m={m} />
      </div>
    </div>
  );
}

function MealPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const days = WEEKDAY_LABELS;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: m.pt(6) }}>
      <p style={{ margin: 0 }}>{page.config.dated ? 'Week of ______________' : `Week ${page.entryIndex}`}</p>
      <table style={{ width: '100%', flex: 1, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={th(theme, m, '18%')}>Day</th>
            <th style={th(theme, m)}>Breakfast</th>
            <th style={th(theme, m)}>Lunch</th>
            <th style={th(theme, m)}>Dinner</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td style={td(theme, m)}>{day.slice(0, 3)}</td>
              <td style={td(theme, m)} />
              <td style={td(theme, m)} />
              <td style={td(theme, m)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogPage({ page, theme, m }: { page: RenderedLcPage; theme: ResolvedInteriorTheme; m: Metrics }) {
  const fields = page.config.fields ?? [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      {fields.map((field) => (
        <LabeledLine key={field.label} label={field.label} theme={theme} m={m} />
      ))}
      <Section title="Notes" theme={theme} m={m} />
    </div>
  );
}

function RuledPage({ kind, theme, m }: { kind: 'lined' | 'dot' | 'graph'; theme: ResolvedInteriorTheme; m: Metrics }) {
  const spacing = m.y(kind === 'lined' ? 0.34 : 0.25);
  const thickness = m.rule;
  let backgroundImage = '';
  let backgroundSize = `${spacing}px ${spacing}px`;
  if (kind === 'lined') {
    backgroundImage = `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - thickness}px, ${theme.rule} ${spacing - thickness}px, ${theme.rule} ${spacing}px)`;
    backgroundSize = 'auto';
  } else if (kind === 'dot') {
    const dot = Math.max(thickness / 2, 1.5);
    backgroundImage = `radial-gradient(circle, ${theme.ink} ${dot}px, transparent ${dot + 0.6}px)`;
  } else {
    backgroundImage = `linear-gradient(to right, ${theme.rule} ${thickness}px, transparent ${thickness}px), linear-gradient(to bottom, ${theme.rule} ${thickness}px, transparent ${thickness}px)`;
  }
  return <div style={{ flex: 1, backgroundImage, backgroundSize, backgroundPosition: '0 0' }} />;
}

function Section({ title, theme, m }: { title: string; theme: ResolvedInteriorTheme; m: Metrics }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, gap: m.pt(4) }}>
      <h2 style={{ margin: 0, fontSize: m.pt(11), letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</h2>
      <div style={{ flex: 1, ...lineFill(theme, m) }} />
    </section>
  );
}

function LabeledLine({ label, theme, m }: { label: string; theme: ResolvedInteriorTheme; m: Metrics }) {
  return (
    <div>
      <div style={{ fontSize: m.pt(8), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: m.pt(3) }}>{label}</div>
      <Rule theme={theme} m={m} />
    </div>
  );
}

function Rule({ theme, m }: { theme: ResolvedInteriorTheme; m: Metrics }) {
  return <div style={{ height: m.rule, background: theme.ink }} />;
}

function lineFill(theme: ResolvedInteriorTheme, m: Metrics): CSSProperties {
  const spacing = m.y(0.32);
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - m.rule}px, ${theme.rule} ${spacing - m.rule}px, ${theme.rule} ${spacing}px)`,
  };
}

function th(theme: ResolvedInteriorTheme, m: Metrics, width?: string): CSSProperties {
  return {
    borderBottom: `${m.rule}px solid ${theme.ink}`,
    borderRight: `${m.rule}px solid ${theme.rule}`,
    padding: m.pt(3),
    fontSize: m.pt(7),
    fontWeight: 600,
    textAlign: 'left',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    width,
  };
}

function td(theme: ResolvedInteriorTheme, m: Metrics): CSSProperties {
  return {
    borderBottom: `${m.rule}px solid ${theme.rule}`,
    borderRight: `${m.rule}px solid ${theme.rule}`,
    padding: m.pt(2),
  };
}
