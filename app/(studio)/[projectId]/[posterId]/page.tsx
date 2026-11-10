import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { ExportButton } from "@/components/ExportButton";
import { ListingBadge } from "@/components/ListingBadge";
import { PosterControlsPanel } from "@/components/PosterControlsPanel";
import { PosterZoomView } from "@/components/PosterZoomView";
import { savedSizes } from "@/lib/posterExports";
import { getProject, getResolvedPoster, getValidSelection } from "@/lib/posterResolver";
import { loadState } from "@/lib/printify/posters";
import { posterSizeFor } from "@/lib/posterSizes";
import { withQuery } from "@/lib/utils";

const CANVAS_ID = "print-canvas";

export default async function PosterPage({ params, searchParams }: PageProps<"/[projectId]/[posterId]">) {
  const { projectId, posterId } = await params;
  const {
    palette,
    titleFont,
    subtitleFont,
    bodyFont,
    titleColor,
    subtitleColor,
    iconColor,
    bodyColor,
    backgroundColor,
    iconRem,
    titleRem,
    subtitleRem,
    bodyRem,
    printSize,
    align,
    bgZoom,
  } = await searchParams;
  const project = getProject(projectId);
  if (!project) notFound();

  const query = getValidSelection(project, {
    palette: String(palette ?? ""),
    titleFont: String(titleFont ?? ""),
    subtitleFont: String(subtitleFont ?? ""),
    bodyFont: String(bodyFont ?? ""),
    titleColor: String(titleColor ?? ""),
    subtitleColor: String(subtitleColor ?? ""),
    iconColor: String(iconColor ?? ""),
    bodyColor: String(bodyColor ?? ""),
    backgroundColor: String(backgroundColor ?? ""),
    iconRem: String(iconRem ?? ""),
    titleRem: String(titleRem ?? ""),
    subtitleRem: String(subtitleRem ?? ""),
    bodyRem: String(bodyRem ?? ""),
    printSize: String(printSize ?? ""),
    align: String(align ?? ""),
    bgZoom: String(bgZoom ?? ""),
  });
  const poster = getResolvedPoster(projectId, posterId, query);
  if (!poster) notFound();

  const state = loadState();
  const synced = Object.values(state.shops).map((shop) => shop.posters[`${projectId}/${posterId}`]).find(Boolean);
  const posterStatus = synced?.publishedAt ? 'published' as const : synced?.productId ? 'ready' as const : undefined;
  const posterSizes = savedSizes(projectId, posterId);
  const [ratioWidth, ratioHeight] = poster.aspectRatio.split("/").map(Number);
  const printHeightInches = (poster.printWidthInches * ratioHeight) / ratioWidth;
  const exportFilename = [projectId, posterId, poster.titleFontName, poster.subtitleFontName]
    .filter(Boolean)
    .join("-");
  return (
    <>
      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="lg:w-1/3 lg:shrink-0">
          <PosterControlsPanel
            nav={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Breadcrumbs
                  items={[
                    { label: "Posters", href: "/" },
                    { label: project.title, href: withQuery(`/${projectId}`, query) },
                    { label: poster.title },
                  ]}
                />
                <ListingBadge sizes={posterSizes} hasEtsy={!!poster.etsy} status={posterStatus} listedSizes={synced?.productId ? Object.keys(synced.images) : undefined} />
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-700">{poster.aspectRatio.replace("/", ":")}</span>
                  <span className="text-neutral-300">·</span>
                  <span>{poster.printWidthInches} × {printHeightInches} in</span>
                  <span className="text-neutral-300">·</span>
                  <span>{poster.printWidthInches * 300} × {Math.round(printHeightInches * 300)} px</span>
                </div>
                <ExportButton
                  elementId={CANVAS_ID}
                  filename={exportFilename}
                  poster={poster}
                  label="Export Poster"
                  listingSize={posterSizeFor(poster.aspectRatio, poster.printWidthInches)}
                  savedSizes={savedSizes(projectId, posterId)}
                  selection={query}
                  className="ml-auto"
                />
                <DeleteItemButton url={`/api/poster-exports/${projectId}/${posterId}`} name={`poster "${posterId}"`} afterHref={`/${projectId}`} />
              </div>
            }
            project={project}
            poster={poster}
            query={query}
            exportFilename={exportFilename}
          />
        </div>

        <div className="mt-2 lg:mt-0 lg:min-w-0 lg:flex-1">
          <PosterZoomView poster={poster} id={CANVAS_ID} />
        </div>
      </div>
    </>
  );
}
