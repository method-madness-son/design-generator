import { promises as fs } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WrapControls } from "@/components/wrapping/WrapControls";
import { WrapExportButton } from "@/components/wrapping/WrapExportButton";
import { WrapPreview } from "@/components/wrapping/WrapPreview";
import { getWrapDesignIds, wrapExportExists, wrapListing } from "@/lib/wrapDesigns";
import { parseWrapParams, type WrapJson } from "@/lib/wrapParams";
import { WRAP_SIZES } from "@/lib/wrapSizes";
import { globalTheme } from "@/lib/theme";
import type { WrapSizeId } from "@/lib/wrapSizes";

export function generateStaticParams() {
  return getWrapDesignIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} — wrapping paper` };
}

export default async function WrapDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const jsonPath = path.join(process.cwd(), "wrapping", id, "wrap.json");

  let raw: WrapJson & { sizes?: string[]; source?: { kind: string; projectId?: string } };
  try {
    raw = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  } catch {
    notFound();
  }

  if (!raw.icons || raw.icons.length === 0) notFound();

  const sp = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const resolved = parseWrapParams(raw, sp);
  const exported = wrapExportExists(id);
  const listing = wrapListing(id);
  const sizes = (raw.sizes ?? []).filter((s): s is WrapSizeId => s in WRAP_SIZES);
  const source = raw.source?.kind === "poster" ? raw.source.projectId ?? "poster" : "Standalone";

  const swatches = globalTheme.wrap_swatches;
  const bgSwatches: Record<string, string> = swatches?.backgrounds ?? {};
  const fgSwatches: Record<string, string> = swatches?.foregrounds ?? {};

  return (
    <>
      <Breadcrumbs items={[{ label: "Wrapping", href: "/wrapping" }, { label: raw.title ?? id }]} />
      <h1 className="mt-2 text-2xl font-semibold">{raw.title ?? id}</h1>
      <p className="mt-1 text-neutral-600">
        {source} · {sizes.map((s) => WRAP_SIZES[s].label).join(", ")} · {raw.icons.length} icons
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Preview */}
        <div className="lg:min-w-0 lg:flex-1">
          <WrapPreview iconNames={raw.icons} customIcons={raw.customIcons} accent={raw.colors?.accent} resolved={resolved} widthPx={600} />
          <p className="mt-2 text-xs text-neutral-500">
            Scaled preview of the 9075&times;10800 tile. The actual export is full resolution.
          </p>
        </div>

        {/* Controls sidebar */}
        <div className="w-full space-y-6 lg:w-72 lg:shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <WrapControls
              defaults={{
                background: raw.colors?.background ?? "#FFFFFF",
                foreground: raw.colors?.foreground ?? "#000000",
              }}
              resolved={resolved}
              bgSwatches={bgSwatches}
              fgSwatches={fgSwatches}
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Export</h3>
            <WrapExportButton designId={id} exported={exported} bg={resolved.background} fg={resolved.foreground} />
          </div>

          {listing.etsy && (
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Etsy listing</h3>
              <p className="text-sm font-medium text-neutral-900">{listing.etsy.title}</p>
              {listing.etsy.tags && (
                <p className="mt-2 text-xs text-neutral-600">
                  Tags: {listing.etsy.tags.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
