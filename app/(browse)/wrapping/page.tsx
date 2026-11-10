import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductTable, STATUS_STYLES, type ProductRow } from "@/components/ProductTable";
import { WrapIconGrid } from "@/components/wrapping/WrapIconGrid";
import { loadState } from "@/lib/printify/posters";
import { loadAllResolvedWraps, wrapExportExists, wrapListing } from "@/lib/wrapDesigns";
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX } from "@/lib/wrapSizes";
import { WRAP_SIZES } from "@/lib/wrapSizes";
import type { ResolvedWrap } from "@/types/wrap";

export const metadata = {
  title: "Wrapping paper",
  description: "Wrapping paper tile designs for Printify.",
};

const THUMB_PX = 150;
const THUMB_SCALE = THUMB_PX / WRAP_TILE_WIDTH_PX;
const THUMB_H = Math.round(WRAP_TILE_HEIGHT_PX * THUMB_SCALE);

function WrapThumb({ wrap }: { wrap: ResolvedWrap }) {
  if (wrap.icons.length === 0) {
    return (
      <div
        className="rounded"
        style={{ width: THUMB_PX, height: THUMB_H, backgroundColor: wrap.colors.background }}
      />
    );
  }
  return (
    <div style={{ width: THUMB_PX, height: THUMB_H, overflow: "hidden" }}>
      <div style={{ transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}>
        <WrapIconGrid
          iconNames={wrap.icons}
          customIcons={wrap.customIcons}
          background={wrap.colors.background}
          foreground={wrap.colors.foreground}
          accent={wrap.colors.accent}
        />
      </div>
    </div>
  );
}

function wrapStatus(wrap: ResolvedWrap, exported: boolean, etsyUrl?: string): ProductRow["status"] {
  if (etsyUrl) return { label: "Live on Etsy", style: STATUS_STYLES.listed };
  if (wrap.errors.length > 0) return { label: "Has errors", style: STATUS_STYLES.warning };
  if (!exported) return { label: "Needs export", style: STATUS_STYLES.warning };
  if (!wrap.etsy) return { label: "Needs listing", style: STATUS_STYLES.warning };
  return { label: "Ready", style: STATUS_STYLES.ready };
}

export default function WrappingPage() {
  const wraps = loadAllResolvedWraps();
  const printify = Object.assign({}, ...Object.values(loadState().shops).map((shop) => shop.posters));
  const rows: ProductRow[] = wraps.map((wrap) => {
    const listing = wrapListing(wrap.id);
    const exported = wrapExportExists(wrap.id);
    const synced = printify[`wrapping/${wrap.id}`] as { etsyUrl?: string; publishedAt?: string; productId?: string } | undefined;
    return {
      id: wrap.id,
      href: `/wrapping/${wrap.id}`,
      title: listing.etsy?.title ?? wrap.title,
      project: wrap.source.kind === "poster" ? wrap.source.projectId : "Standalone",
      status: wrapStatus(wrap, exported, synced?.etsyUrl),
      detail: wrap.sizes.map((s) => WRAP_SIZES[s].label).join(", "),
      etsyUrl: synced?.etsyUrl,
      thumbnail: <WrapThumb wrap={wrap} />,
    };
  });

  const listed = rows.filter((r) => r.status.label === "Live on Etsy");
  const rest = rows.filter((r) => r.status.label !== "Live on Etsy");

  return (
    <>
      <Breadcrumbs items={[{ label: "Wrapping paper" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Wrapping paper</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Tiled patterns printed on 90gsm fine art paper via Printify. Each design uploads one
        9075&times;10800 tile that Printify repeats across the roll. Export with{" "}
        <code className="text-sm">npm run wrap-art</code>.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        {listed.length} listed · {rest.length} in progress · {rows.length} total
      </p>
      {listed.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Live on Etsy ({listed.length})</h2>
          <ProductTable rows={listed} />
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">In progress ({rest.length})</h2>
          <ProductTable rows={rest} />
        </section>
      )}
    </>
  );
}
