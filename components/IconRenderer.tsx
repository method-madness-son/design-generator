import type { CSSProperties } from 'react';
import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

// Accepts either "Leaf" or "leaf" / "battery-low" style names.
const toPascalCase = (name: string) =>
  name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export function IconRenderer({
  name,
  className,
  sizeRem,
  style,
}: {
  name: string;
  className?: string;
  sizeRem: number;
  // Merged in after the size, so e.g. an explicit color here wins over the className's.
  style?: CSSProperties;
}) {
  const Icon = icons[toPascalCase(name) as IconName];
  if (!Icon) return null;
  return (
    <Icon
      className={className}
      style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem`, ...style }}
      strokeWidth={2.25}
      aria-hidden
    />
  );
}
