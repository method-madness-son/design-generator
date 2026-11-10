import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { WrapIconGrid } from "@/components/wrapping/WrapIconGrid";
import { getWrapDesignIds } from "@/lib/wrapDesigns";
import { parseWrapParams, type WrapJson } from "@/lib/wrapParams";

export function generateStaticParams() {
  return getWrapDesignIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `${id} — wrap print`, robots: { index: false, follow: false } };
}

export default async function WrapArtPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const jsonPath = path.join(process.cwd(), "wrapping", id, "wrap.json");

  let raw: WrapJson;
  try {
    raw = JSON.parse(await fs.readFile(jsonPath, "utf8")) as WrapJson;
  } catch {
    notFound();
  }

  if (!raw.icons || raw.icons.length === 0) {
    return (
      <div data-wrap-error="1" className="p-6 text-sm text-neutral-900">
        <h1 className="text-lg font-semibold">Cannot render {id}</h1>
        <p className="mt-2">No icons defined in wrap.json.</p>
      </div>
    );
  }

  const sp = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const resolved = parseWrapParams(raw, sp);

  return (
    <WrapIconGrid
      iconNames={raw.icons}
      customIcons={raw.customIcons}
      background={resolved.background}
      foreground={resolved.foreground}
      accent={raw.colors?.accent}
      cellSizeIn={resolved.cellSizeIn}
      iconSizeIn={resolved.iconSizeIn}
      glowIn={resolved.glowIn}
      opacity={resolved.opacity}
      strokeWidth={resolved.strokeWidth}
    />
  );
}
