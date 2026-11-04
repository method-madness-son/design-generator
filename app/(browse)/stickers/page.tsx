import fs from "node:fs";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CANVAS_WIDTH, PosterCanvas } from "@/components/PosterCanvas";
import { getProject } from "@/lib/posterResolver";
import { loadState } from "@/lib/printify/posters";
import { loadSticker, stickerExportPath, stickerIds, stickerListing, stickerProjects } from "@/lib/stickerDesigns";
import { STICKER_TYPES } from "@/lib/stickerSizes";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Stickers",
  description: "Sticker designs made from the poster projects.",
};

const PREVIEW_PX = 288;

export default function StickersPage() {
  const printify = Object.assign({}, ...Object.values(loadState().shops).map((shop) => shop.posters));
  return (
    <>
      <Breadcrumbs items={[{ label: "Stickers" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Stickers</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Poster designs reflowed for Printify&apos;s kiss-cut, square, and rectangular bumper stickers. Open one to choose its type, customize it, and save it.
      </p>
      {stickerProjects().map((projectId) => (
        <section key={projectId} className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">{getProject(projectId)?.title ?? projectId}</h2>
          <ul className="mt-4 flex flex-wrap gap-5">
            {stickerIds(projectId).map((id) => {
              const sticker = loadSticker(projectId, id);
              if (!sticker) return null;
              const saved = fs.existsSync(stickerExportPath(projectId, id, sticker.type));
              const listed = !!stickerListing(projectId, id).etsy;
              const etsyUrl = (printify[`stickers/${projectId}/${id}`] as { etsyUrl?: string } | undefined)?.etsyUrl;
              return (
                <li key={id} style={{ width: PREVIEW_PX }}>
                  <Link href={`/stickers/${projectId}/${id}`} className="group block">
                    <div
                      className={cn(
                        "overflow-hidden border border-neutral-200 bg-white shadow-sm transition group-hover:border-neutral-400",
                        sticker.type === "kiss-cut" && "rounded-xl",
                      )}
                      style={{ width: PREVIEW_PX, height: (PREVIEW_PX * STICKER_TYPES[sticker.type].heightPx) / STICKER_TYPES[sticker.type].widthPx }}
                    >
                      <div style={{ transform: `scale(${PREVIEW_PX / CANVAS_WIDTH})`, transformOrigin: "top left" }}>
                        <PosterCanvas poster={sticker.poster} />
                      </div>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-neutral-900">{id}</h3>
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {STICKER_TYPES[sticker.type].label} · {saved ? "Print file built" : "No print file"} ·{" "}
                    {etsyUrl ? (
                      <a href={etsyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Etsy listing ↗
                      </a>
                    ) : listed ? "Listing written" : "No listing"}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
