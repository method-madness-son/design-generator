import { dedupeSimilarColors } from '@/lib/colorSort';
import { EDITOR_THEME_COLORS } from '@/lib/editorThemeColors';
import { NEUTRAL_COLORS } from '@/lib/neutralColors';
import { PASTEL_COLORS } from '@/lib/pastelColors';
import type { ProjectConfig } from '@/types/poster';

// Named color choices for a single project: its own ink, plus the shared pastel accents (see
// lib/pastelColors.ts), code-editor-theme accents (see lib/editorThemeColors.ts), and neutral
// gray accents (see lib/neutralColors.ts) — offered identically on every project. The project's
// own bright "neon" palette accents are intentionally left out here: they clashed with these
// curated sets and made the picker redundant. A project's own colorPalette still sets the
// poster's un-customized default appearance; this list only controls what's offered in the
// picker.
export function getColorOptions(project: ProjectConfig): Record<string, string> {
  const entries: [string, string][] = [['Ink', project.colorPalette.ink]];
  for (const [name, { accent }] of Object.entries(PASTEL_COLORS)) {
    entries.push([name, accent]);
  }
  for (const [name, { accent }] of Object.entries(EDITOR_THEME_COLORS)) {
    entries.push([name, accent]);
  }
  for (const [name, { accent }] of Object.entries(NEUTRAL_COLORS)) {
    entries.push([name, accent]);
  }
  return Object.fromEntries(dedupeSimilarColors(entries));
}
