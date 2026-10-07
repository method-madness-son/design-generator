'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  label: string;
  // Query parameter this select controls, e.g. "palette".
  param: string;
  options: string[];
  // Currently selected option; empty means each poster's own default.
  value: string;
  swatches?: Record<string, string>;
  // Appended after each option's value for display, e.g. "rem" -> "2.5rem".
  optionSuffix?: string;
};

export function QuerySelect({ label, param, options, value, swatches, optionSuffix }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  // Read live from the URL rather than a server-passed prop, so two dropdowns changed in
  // quick succession each build on the other's choice instead of racing and overwriting it.
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(param, next);
    else params.delete(param);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-neutral-500">{label}</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-md border border-neutral-200 bg-white px-2 py-1 capitalize"
      >
        <option value="">Poster default</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {optionSuffix ? `${name}${optionSuffix}` : name}
          </option>
        ))}
      </select>
      {swatches && (
        <span className="flex gap-1">
          {Object.entries(swatches).map(([key, color]) => (
            <span
              key={key}
              title={`${key} ${color}`}
              className="size-4 rounded-full border border-neutral-300"
              style={{ background: color }}
            />
          ))}
        </span>
      )}
    </label>
  );
}
