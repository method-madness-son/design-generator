'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Updates one or more query params to the same value in a single navigation. Reads live from the
// URL rather than a server-passed prop, so two controls changed in quick succession each build on
// the other's choice instead of racing and overwriting it.
export function useQueryParams(params: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function setParams(next: string) {
    const merged = new URLSearchParams(searchParams.toString());
    for (const param of params) {
      if (next) merged.set(param, next);
      else merged.delete(param);
    }
    const query = merged.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
}

// Updates a single query param in place.
export function useQueryParam(param: string) {
  return useQueryParams([param]);
}
