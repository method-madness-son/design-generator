import { EDITOR_THEME_COLORS } from '@/lib/editorThemeColors';
import { NEUTRAL_COLORS } from '@/lib/neutralColors';
import { PASTEL_COLORS } from '@/lib/pastelColors';

// Background color options, offered identically everywhere the background picker appears (not
// tied to any project's own palette): the bright pastels (lib/pastelColors.ts), the dark
// code-editor-theme backgrounds (lib/editorThemeColors.ts), and a few neutral white/gray shades
// (lib/neutralColors.ts).
export const BACKGROUND_COLORS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PASTEL_COLORS).map(([name, { background }]) => [name, background])),
  ...Object.fromEntries(Object.entries(EDITOR_THEME_COLORS).map(([name, { background }]) => [name, background])),
  ...Object.fromEntries(Object.entries(NEUTRAL_COLORS).map(([name, { background }]) => [name, background])),
};
