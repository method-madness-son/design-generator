import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Appends the non-empty entries of query to path.
export function withQuery(path: string, query: Record<string, string>) {
  const search = new URLSearchParams(Object.entries(query).filter(([, value]) => value)).toString();
  return search ? `${path}?${search}` : path;
}
