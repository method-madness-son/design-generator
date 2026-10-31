import type { CSSProperties, ReactNode } from 'react';
import type { SheetMetrics } from '@/components/lowcontent/InteriorSheet';
import { WEEKDAY_LABELS } from '@/lib/lowcontent/templates';
import type { RenderedLcPage, ResolvedInteriorTheme } from '@/types/lowcontent';

type BodyProps = {
  page: RenderedLcPage;
  theme: ResolvedInteriorTheme;
  m: SheetMetrics;
};

const PLANNER = new Set([
  'quick-start',
  'brain-dump',
  'sort-page',
  'daily-plan',
  'weekly-overview',
  'weekly-reset',
  'tiny-step',
  'dopamine-menu',
  'task-reward',
  'launch-shutdown',
  'urgent-important',
  'monthly-review',
  'fresh-start',
  'low-energy',
  'energy-check',
  'body-double',
  'decision-helper',
  'parking-lot',
  'wins-list',
  'day-routine',
  'focus-log',
  'appointments',
  'project-planner',
  'mood-sleep',
]);

export function PlannerBody({ page, theme, m }: BodyProps): ReactNode {
  if (!PLANNER.has(page.template)) return null;
  switch (page.template) {
    case 'quick-start':
      return page.config.variant === 'skip' ? <SkipPage theme={theme} m={m} /> : <LoopPage theme={theme} m={m} />;
    case 'brain-dump':
      return <DumpPage theme={theme} m={m} />;
    case 'sort-page':
      return <SortPage theme={theme} m={m} />;
    case 'daily-plan':
      return <DailyPage page={page} theme={theme} m={m} />;
    case 'weekly-overview':
      return <OverviewPage page={page} theme={theme} m={m} />;
    case 'weekly-reset':
      return <ResetPage theme={theme} m={m} />;
    case 'tiny-step':
      return <TinyPage theme={theme} m={m} />;
    case 'dopamine-menu':
      return <MenuPage page={page} theme={theme} m={m} />;
    case 'task-reward':
      return <RewardPage theme={theme} m={m} />;
    case 'launch-shutdown':
      return <RoutineList theme={theme} m={m} items={page.config.variant === 'shutdown' ? SHUTDOWN : LAUNCH} note={RESTART} />;
    case 'urgent-important':
      return (
        <QuadPage
          theme={theme}
          m={m}
          cells={['Do now', 'Schedule', 'Hand off or shorten', 'Let go']}
        />
      );
    case 'monthly-review':
      return <Stacked title="Look back only as far as you want" labels={['What worked', 'What to drop', 'What to carry']} theme={theme} m={m} />;
    case 'fresh-start':
      return <FreshPage theme={theme} m={m} />;
    case 'low-energy':
      return <QuadPage theme={theme} m={m} cells={['Basics', 'Easy comforts', 'Can skip', 'One tiny step']} columns={2} />;
    case 'energy-check':
      return <Stacked title="What energy do I have?" labels={['High', 'Medium', 'Low']} theme={theme} m={m} />;
    case 'body-double':
      return <BodyPage theme={theme} m={m} />;
    case 'decision-helper':
      return <DecisionPage theme={theme} m={m} />;
    case 'parking-lot':
      return <LinesPage title="Ideas for later. Not for today." theme={theme} m={m} />;
    case 'wins-list':
      return <LinesPage title="Done. That counts." theme={theme} m={m} />;
    case 'day-routine':
      return (
        <RoutineList
          theme={theme}
          m={m}
          items={page.config.variant === 'evening' ? EVENING : MORNING}
          note="Skip any line. A short list is enough."
        />
      );
    case 'focus-log':
      return <FocusPage theme={theme} m={m} />;
    case 'appointments':
      return <AppointmentsPage theme={theme} m={m} />;
    case 'project-planner':
      return <ProjectPage theme={theme} m={m} />;
    case 'mood-sleep':
      return <MoodPage theme={theme} m={m} />;
    default:
      return null;
  }
}

const LAUNCH = ['Name the task', 'Write the next tiny step', 'Set a short timer', 'Start'];
const SHUTDOWN = ['What I finished', 'What can wait', 'Where I will restart'];
const RESTART = 'If you stopped, start again at the next tiny step. Nothing is late.';
const MORNING = ['Open this book', 'Pick the top task', 'Set a short timer'];
const EVENING = ['Write one win', 'Move leftover tasks', 'Close the book'];

function LoopPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  const steps = ['Dump what is on your mind', 'Pick three things', 'Do the next tiny step', 'Write one win'];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>How to use this in two minutes.</p>
      {steps.map((step, index) => (
        <Box key={step} theme={theme} m={m}>
          <strong style={{ fontSize: m.pt(16) }}>{index + 1}</strong>
          <span style={{ fontSize: m.pt(12), lineHeight: 1.5 }}>{step}</span>
        </Box>
      ))}
      <p style={{ margin: 0, fontSize: m.pt(11) }}>Not medical advice.</p>
    </div>
  );
}

function SkipPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: m.pt(16) }}>
      <h2 style={display(theme, m, 22)}>Skipped some pages?</h2>
      <p style={{ margin: 0, fontSize: m.pt(16), lineHeight: 1.5 }}>Start at the next page. Missed days are fine. Just start here.</p>
      <Box theme={theme} m={m}>
        <span style={label(m)}>Today I will</span>
      </Box>
      <Box theme={theme} m={m}>
        <span style={label(m)}>Next tiny step</span>
      </Box>
    </div>
  );
}

function DumpPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>Write everything. Sort later.</p>
      <div style={{ flex: 1, border: border(theme, m, 2), ...dots(theme, m) }} />
      <p style={{ margin: 0, textAlign: 'right', fontSize: m.pt(12) }}>Sort it on the next page →</p>
    </div>
  );
}

function SortPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  const cells = [
    { name: 'Now', heavy: true, lines: 3 },
    { name: 'Next', heavy: false, lines: 4 },
    { name: 'Later', heavy: false, lines: 4 },
    { name: 'Let go', heavy: false, lines: 4 },
  ];
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: m.y(0.2), minHeight: 0 }}>
      {cells.map((cell) => (
        <Box key={cell.name} theme={theme} m={m} heavy={cell.heavy}>
          <span style={{ ...label(m), fontSize: m.pt(18), fontFamily: fontFamilyHeader() }}>{cell.name}</span>
          {Array.from({ length: cell.lines }, (_, index) => (
            <div key={index} style={{ display: 'flex', gap: m.pt(6), alignItems: 'center' }}>
              <span style={{ width: m.y(0.18), height: m.y(0.18), border: border(theme, m, 1) }} />
              <span style={{ flex: 1, borderBottom: `${m.pt(0.75)}px solid ${theme.ink}` }} />
            </div>
          ))}
        </Box>
      ))}
    </div>
  );
}

function DailyPage({ theme, m }: BodyProps) {
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `${m.x(1)}px 1fr`, gap: m.y(0.2), minHeight: 0 }}>
      <TimeColumn theme={theme} m={m} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: m.y(0.2), minHeight: 0 }}>
        <Box theme={theme} m={m} heavy>
          <span style={label(m)}>Top 3</span>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', gap: m.pt(6), alignItems: 'center', minHeight: m.y(0.42) }}>
              <strong style={{ fontSize: m.pt(14) }}>{n}</strong>
              <span style={{ flex: 1, borderBottom: `${m.pt(0.75)}px solid ${theme.ink}` }} />
            </div>
          ))}
        </Box>
        <Box theme={theme} m={m}>
          <span style={label(m)}>Bonus if energy</span>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', gap: m.pt(6), alignItems: 'center' }}>
              <span style={{ width: m.y(0.18), height: m.y(0.18), border: border(theme, m, 1), borderRadius: m.y(0.04) }} />
              <span style={{ flex: 1, borderBottom: `${m.pt(0.75)}px solid ${theme.ink}` }} />
            </div>
          ))}
        </Box>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: m.y(0.2) }}>
          <Box theme={theme} m={m}>
            <span style={label(m)}>Energy</span>
            <span style={{ fontSize: m.pt(12) }}>Shade the battery</span>
            <div style={{ display: 'flex', gap: m.pt(3), marginTop: m.pt(4) }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ flex: 1, height: m.y(0.28), border: border(theme, m, 1), background: n === 1 ? '#D9D9D9' : 'transparent' }} />
              ))}
            </div>
          </Box>
          <Box theme={theme} m={m}>
            <span style={label(m)}>Wins</span>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ fontSize: m.pt(12) }}>★ ________</div>
            ))}
          </Box>
        </div>
      </div>
    </div>
  );
}

function TimeColumn({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  return (
    <div style={{ border: border(theme, m), display: 'flex', flexDirection: 'column', minHeight: 0, padding: m.pt(4) }}>
      <span style={label(m)}>Time</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {hours.map((hour, index) => (
          <div key={index} style={{ flex: 1, borderTop: `${m.pt(1)}px solid ${theme.ink}`, position: 'relative', fontSize: m.pt(9), fontWeight: 700 }}>
            <span>{hour}</span>
            <span style={{ position: 'absolute', left: '42%', top: '50%', width: '40%', borderTop: `${m.pt(0.75)}px dotted ${theme.ink}` }} />
          </div>
        ))}
      </div>
      <div style={{ border: border(theme, m), minHeight: m.pt(28), padding: m.pt(3), fontSize: m.pt(8) }}>Time left</div>
    </div>
  );
}

function OverviewPage({ page, theme, m }: BodyProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>{page.config.heading}</p>
      <span style={label(m)}>Big 3 for the week</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: m.pt(6), minHeight: m.pt(70) }}>
        {[1, 2, 3].map((n) => (
          <Box key={n} theme={theme} m={m}>
            <strong>{n}</strong>
          </Box>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: m.pt(11), lineHeight: 1.5 }}>Missed days are fine. Just start here.</p>
      <Box theme={theme} m={m} heavy>
        <span style={label(m)}>One focus this week</span>
      </Box>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} style={{ flex: 1, display: 'flex', gap: m.pt(8), borderTop: `${m.rule}px solid ${theme.ink}`, alignItems: 'center' }}>
            <span style={{ width: '28%', fontSize: m.pt(10), letterSpacing: '0.04em' }}>{day.slice(0, 3).toUpperCase()}</span>
            <span style={{ flex: 1, borderBottom: `${m.rule}px solid ${theme.rule}` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResetPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return <Stacked title="Close the week" labels={['Finished', 'Move forward', 'Leave behind', 'Next week, three things']} theme={theme} m={m} />;
}

function TinyPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <Box theme={theme} m={m}>
        <span style={label(m)}>The task</span>
      </Box>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(6), minHeight: 0 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} style={{ flex: 1, display: 'flex', gap: m.pt(8), alignItems: 'center', borderBottom: `${m.rule}px solid ${theme.ink}` }}>
            <strong style={{ fontSize: m.pt(14) }}>{n}</strong>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: m.pt(12) }}>The first step is enough.</p>
    </div>
  );
}

function MenuPage({ page, theme, m }: BodyProps) {
  const example = page.config.variant === 'example';
  const groups = [
    ['Starters', ['A song', 'A stretch']],
    ['Mains', ['A short walk', 'A call']],
    ['Sides', ['A snack', 'A window']],
    ['Desserts', ['A show', 'A game']],
  ] as const;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(6), minHeight: 0 }}>
      <p style={lead(m)}>{example ? 'A sample menu. Write your own on the next page.' : 'Your menu. Pick one before you start.'}</p>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: m.pt(6), minHeight: 0 }}>
        {groups.map(([name, ideas]) => (
          <Box key={name} theme={theme} m={m}>
            <span style={label(m)}>{name}</span>
            {example ? ideas.map((idea) => <span key={idea} style={{ fontSize: m.pt(12) }}>{idea}</span>) : <div style={{ flex: 1, ...lines(theme, m, 0.32) }} />}
          </Box>
        ))}
      </div>
    </div>
  );
}

function RewardPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      {[1, 2, 3].map((n) => (
        <Box key={n} theme={theme} m={m}>
          <span style={label(m)}>Task {n}</span>
          <span style={{ fontSize: m.pt(11) }}>Small boost</span>
          <span style={{ fontSize: m.pt(11) }}>Treat after</span>
        </Box>
      ))}
    </div>
  );
}

function RoutineList({ theme, m, items, note }: { theme: ResolvedInteriorTheme; m: SheetMetrics; items: string[]; note: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      {items.map((item) => (
        <Box key={item} theme={theme} m={m}>
          <span style={{ width: m.pt(16), height: m.pt(16), border: border(theme, m) }} />
          <span style={{ fontSize: m.pt(14) }}>{item}</span>
        </Box>
      ))}
      <p style={{ margin: 0, fontSize: m.pt(12), lineHeight: 1.35 }}>{note}</p>
    </div>
  );
}

function FreshPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: m.pt(14) }}>
      <h2 style={display(theme, m, 26)}>Back again.</h2>
      <p style={{ margin: 0, fontSize: m.pt(16) }}>No catch-up. Start here.</p>
      <Box theme={theme} m={m}><span style={label(m)}>Today</span></Box>
      <Box theme={theme} m={m}><span style={label(m)}>Next tiny step</span></Box>
    </div>
  );
}

function BodyPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>Who I worked beside.</p>
      {[1, 2, 3].map((n) => (
        <Box key={n} theme={theme} m={m}>
          <span style={label(m)}>Who · when</span>
          <span style={{ fontSize: m.pt(11) }}>What we worked on</span>
        </Box>
      ))}
    </div>
  );
}

function DecisionPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      {['Option A', 'Option B', 'Option C'].map((name) => (
        <Box key={name} theme={theme} m={m}>
          <span style={label(m)}>{name}</span>
          <span style={{ fontSize: m.pt(11) }}>One reason for · one reason against</span>
        </Box>
      ))}
      <Box theme={theme} m={m}>
        <span style={{ ...label(m), fontSize: m.pt(12) }}>Good enough pick</span>
      </Box>
    </div>
  );
}

function FocusPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <p style={lead(m)}>Focus timer sessions</p>
      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.5fr 1.4fr', borderBottom: `${m.rule}px solid ${theme.ink}`, fontSize: m.pt(9), letterSpacing: '0.04em' }}>
        <span>START</span><span>MINUTES</span><span>WHAT I STARTED</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.7fr 0.5fr 1.4fr', borderBottom: `${m.rule}px solid ${theme.ink}` }} />
        ))}
      </div>
    </div>
  );
}

function AppointmentsPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: m.pt(8), minHeight: 0 }}>
      <Box theme={theme} m={m}>
        <span style={label(m)}>Appointments</span>
        <div style={{ flex: 1, ...lines(theme, m) }} />
      </Box>
      <Box theme={theme} m={m}>
        <span style={label(m)}>Names and numbers</span>
        <div style={{ flex: 1, ...lines(theme, m) }} />
      </Box>
    </div>
  );
}

function ProjectPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <Box theme={theme} m={m}><span style={label(m)}>Goal</span></Box>
      <Box theme={theme} m={m}>
        <span style={label(m)}>Milestones</span>
        <div style={{ flex: 1, ...lines(theme, m) }} />
      </Box>
      <Box theme={theme} m={m}><span style={label(m)}>Next tiny step</span></Box>
    </div>
  );
}

function MoodPage({ theme, m }: { theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: m.pt(6) }}>
      <p style={{ margin: 0, fontSize: m.pt(11) }}>Only if you want a note. Skip the whole page if you do not.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1fr', fontSize: m.pt(9) }}>
        <span>DAY</span><span>MOOD</span><span>SLEEP</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.7fr 1fr 1fr', borderTop: `${m.rule}px solid ${theme.ink}`, alignItems: 'center', fontSize: m.pt(11) }}>
            <span>{day.slice(0, 3)}</span><span /><span />
          </div>
        ))}
      </div>
    </div>
  );
}

function LinesPage({ title, theme, m }: { title: string; theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>{title}</p>
      <div style={{ flex: 1, ...lines(theme, m, 0.38) }} />
    </div>
  );
}

function Stacked({ title, labels, theme, m }: { title: string; labels: string[]; theme: ResolvedInteriorTheme; m: SheetMetrics }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: m.pt(8), minHeight: 0 }}>
      <p style={lead(m)}>{title}</p>
      {labels.map((name) => (
        <Box key={name} theme={theme} m={m}>
          <span style={label(m)}>{name}</span>
        </Box>
      ))}
    </div>
  );
}

function QuadPage({
  theme,
  m,
  cells,
  columns = 2,
}: {
  theme: ResolvedInteriorTheme;
  m: SheetMetrics;
  cells: string[];
  columns?: number;
}) {
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: '1fr 1fr', gap: m.pt(8), minHeight: 0 }}>
      {cells.map((name) => (
        <Box key={name} theme={theme} m={m}>
          <span style={{ ...label(m), fontSize: m.pt(13) }}>{name}</span>
        </Box>
      ))}
    </div>
  );
}

function Box({ theme, m, children, heavy = false }: { theme: ResolvedInteriorTheme; m: SheetMetrics; children: ReactNode; heavy?: boolean }) {
  return (
    <div style={{ flex: 1, minHeight: 0, border: border(theme, m, heavy ? 2 : 1), borderRadius: m.y(0.08), padding: m.pt(8), display: 'flex', flexDirection: 'column', gap: m.pt(4) }}>
      {children}
    </div>
  );
}

function border(theme: ResolvedInteriorTheme, m: SheetMetrics, points = 1): string {
  return `${Math.max(m.pt(0.75), m.pt(points))}px solid ${theme.ink}`;
}

function label(m: SheetMetrics): CSSProperties {
  return { fontSize: m.pt(12), letterSpacing: '0.02em', fontWeight: 700 };
}

function fontFamilyHeader(): string {
  return 'var(--font-lexend), sans-serif';
}

function dots(theme: ResolvedInteriorTheme, m: SheetMetrics): CSSProperties {
  const spacing = m.y(0.25);
  const dot = Math.max(m.pt(0.75) / 2, 1.5);
  return {
    backgroundImage: `radial-gradient(circle, ${theme.ink} ${dot}px, transparent ${dot + 0.6}px)`,
    backgroundSize: `${spacing}px ${spacing}px`,
  };
}

function lead(m: SheetMetrics): CSSProperties {
  return { margin: 0, fontSize: m.pt(13) };
}

function display(theme: ResolvedInteriorTheme, m: SheetMetrics, points: number): CSSProperties {
  return { margin: 0, fontFamily: theme.displayFontCss, fontSize: m.pt(points), fontWeight: 400, lineHeight: 1.05 };
}

function lines(theme: ResolvedInteriorTheme, m: SheetMetrics, inches = 0.36): CSSProperties {
  const spacing = m.y(inches);
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - m.rule}px, ${theme.ink} ${spacing - m.rule}px, ${theme.ink} ${spacing}px)`,
  };
}
