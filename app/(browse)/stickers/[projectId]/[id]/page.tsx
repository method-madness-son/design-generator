import fs from "node:fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { PosterCanvas } from "@/components/PosterCanvas";
import { PosterControlsPanel } from "@/components/PosterControlsPanel";
import { PosterZoomView } from "@/components/PosterZoomView";
import { StickerFitReport } from "@/components/stickers/StickerFitReport";
import { StickerSaveButton } from "@/components/stickers/StickerSaveButton";
import { StickerStage } from "@/components/stickers/StickerStage";
import { StickerTypePicker } from "@/components/stickers/StickerTypePicker";
import { getProject } from "@/lib/posterResolver";
import { loadSticker, stickerExportPath } from "@/lib/stickerDesigns";
import { STICKER_TYPES } from "@/lib/stickerSizes";

const CANVAS_ID = "sticker-art";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} — sticker` };
}

export default async function StickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { projectId, id } = await params;
  const requested = Object.fromEntries(Object.entries(await searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const project = getProject(projectId);
  const sticker = loadSticker(projectId, id, requested);
  if (!project || !sticker) notFound();
  const { cutAroundArt, poster, query, type } = sticker;
  const signature = JSON.stringify({ query, type, rems: [poster.titleRem, poster.subtitleRem, poster.bodyRem, poster.iconRem] });

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <div className="lg:w-1/3 lg:shrink-0">
        <PosterControlsPanel
          nav={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Breadcrumbs items={[{ label: "Stickers", href: "/stickers" }, { label: project.title, href: "/stickers" }, { label: id }]} />
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-semibold text-neutral-700">{project.title}</span>
                <span className="text-neutral-300">·</span>
                <span>{STICKER_TYPES[type].sizes}</span>
                <span className="text-neutral-300">·</span>
                <span>{STICKER_TYPES[type].widthPx} × {STICKER_TYPES[type].heightPx} px</span>
              </div>
              <StickerSaveButton
                canvasId={CANVAS_ID}
                projectId={projectId}
                id={id}
                type={type}
                selection={query}
                saved={fs.existsSync(stickerExportPath(projectId, id, type))}
              />
              <DeleteItemButton url={`/api/sticker-exports/${projectId}/${id}`} name={`sticker "${id}"`} afterHref="/stickers" />
            </div>
          }
          project={project}
          poster={poster}
          query={query}
          exportFilename={id}
          layoutControls={<StickerTypePicker key="type" value={type} />}
        />
        <div className="mt-2 space-y-1 px-1">
          <p className="text-xs text-neutral-600">{cutAroundArt ? "Peels off a backing sheet, cut around the design. The print file's background is transparent, and the line shown is an estimate until a Printify mockup confirms it." : STICKER_TYPES[type].note}</p>
          <StickerFitReport canvasId={CANVAS_ID} type={type} signature={signature} />
        </div>
      </div>
      <div className="mt-2 lg:mt-0 lg:min-w-0 lg:flex-1">
        <PosterZoomView poster={poster} id={CANVAS_ID}>
          <StickerStage type={type} cutAround={cutAroundArt ? CANVAS_ID : undefined}>
            <PosterCanvas poster={poster} id={CANVAS_ID} />
          </StickerStage>
        </PosterZoomView>
      </div>
    </div>
  );
}
