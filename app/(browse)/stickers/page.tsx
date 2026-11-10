import fs from "node:fs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CANVAS_WIDTH, PosterCanvas } from "@/components/PosterCanvas";
import { ProductTable, STATUS_STYLES, type ProductRow } from "@/components/ProductTable";
import { getProject } from "@/lib/posterResolver";
import { loadState } from "@/lib/printify/posters";
import { loadSticker, stickerExportPath, stickerIds, stickerListing, stickerProjects } from "@/lib/stickerDesigns";
import { STICKER_TYPES } from "@/lib/stickerSizes";

export const metadata = {
  title: "Stickers",
  description: "Sticker designs made from the poster projects.",
};

const THUMB_PX = 150;

function StickerThumb({ sticker }: { sticker: NonNullable<ReturnType<typeof loadSticker>> }) {
  return (
    <div style={{ width: THUMB_PX, height: THUMB_PX, overflow: "hidden" }}>
      <div style={{ transform: `scale(${THUMB_PX / CANVAS_WIDTH})`, transformOrigin: "top left" }}>
        <PosterCanvas poster={sticker.poster} />
      </div>
    </div>
  );
}

function stickerStatus(saved: boolean, hasListing: boolean, etsyUrl?: string): ProductRow["status"] {
  if (etsyUrl) return { label: "Live on Etsy", style: STATUS_STYLES.listed };
  if (saved && hasListing) return { label: "Ready", style: STATUS_STYLES.ready };
  if (saved) return { label: "Needs listing", style: STATUS_STYLES.warning };
  if (hasListing) return { label: "Needs export", style: STATUS_STYLES.warning };
  return { label: "Idea", style: STATUS_STYLES.idea };
}

export default function StickersPage() {
  const printify = Object.assign({}, ...Object.values(loadState().shops).map((shop) => shop.posters));
  const rows: ProductRow[] = [];
  for (const projectId of stickerProjects()) {
    const projectTitle = getProject(projectId)?.title ?? projectId;
    for (const id of stickerIds(projectId)) {
      const sticker = loadSticker(projectId, id);
      if (!sticker) continue;
      const saved = fs.existsSync(stickerExportPath(projectId, id, sticker.type));
      const listing = stickerListing(projectId, id);
      const synced = printify[`stickers/${projectId}/${id}`] as { etsyUrl?: string; publishedAt?: string } | undefined;
      rows.push({
        id: `stickers/${projectId}/${id}`,
        href: `/stickers/${projectId}/${id}`,
        title: listing.etsy?.title ?? id,
        project: projectTitle,
        status: stickerStatus(saved, !!listing.etsy, synced?.etsyUrl),
        detail: STICKER_TYPES[sticker.type].label,
        etsyUrl: synced?.etsyUrl,
        thumbnail: <StickerThumb sticker={sticker} />,
      });
    }
  }
  const listed = rows.filter((r) => r.status.label === "Live on Etsy");
  const rest = rows.filter((r) => r.status.label !== "Live on Etsy");
  return (
    <>
      <Breadcrumbs items={[{ label: "Stickers" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Stickers</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Poster designs reflowed for Printify&apos;s kiss-cut, square, and rectangular bumper stickers. Open one to choose its type, customize it, and save it.
      </p>
      <p className="mt-2 text-sm text-neutral-500">{listed.length} listed · {rest.length} in progress · {rows.length} total</p>
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
