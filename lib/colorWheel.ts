import { hexToHsl } from '@/lib/colorSort';

// Position for a swatch on an HSV-style color wheel: angle = hue, distance from center =
// saturation. Achromatic colors (grays) land near the center, like the neutral core of a real
// color wheel; a floor keeps them from stacking exactly on top of each other or the origin.
const MIN_DISTANCE_RATIO = 0.12;

export function getWheelPosition(hex: string, radius: number): { x: number; y: number } {
  const hsl = hexToHsl(hex);
  if (!hsl) return { x: 0, y: 0 };
  const angleRad = (hsl.h * Math.PI) / 180;
  const distance = Math.max(hsl.s, MIN_DISTANCE_RATIO) * radius;
  return { x: Math.cos(angleRad) * distance, y: Math.sin(angleRad) * distance };
}
