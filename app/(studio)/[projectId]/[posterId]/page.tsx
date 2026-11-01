import Link from "next/link";
import { notFound } from "next/navigation";
import { ExportButton } from "@/components/ExportButton";
import { PosterControlsPanel } from "@/components/PosterControlsPanel";
import { PosterZoomView } from "@/components/PosterZoomView";
import { savedSizes } from "@/lib/posterExports";
import { getProject, getResolvedPoster, getValidSelection } from "@/lib/posterResolver";
import { POSTER_SIZES, posterSizeFor, posterSizePixels } from "@/lib/posterSizes";
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
  });
  const poster = getResolvedPoster(projectId, posterId, query);
  if (!poster) notFound();

  const [ratioWidth, ratioHeight] = poster.aspectRatio.split("/").map(Number);
  const printHeightInches = (poster.printWidthInches * ratioHeight) / ratioWidth;
  const exportFilename = [projectId, posterId, poster.titleFontName, poster.subtitleFontName]
    .filter(Boolean)
    .join("-");
  const listingSize = posterSizeFor(poster.aspectRatio, poster.printWidthInches);
  const listing = {
    size: listingSize,
    sizeLabel: listingSize ? POSTER_SIZES[listingSize].label : undefined,
    ...(listingSize ? posterSizePixels(listingSize) : { width: 0, height: 0 }),
    savedSizes: savedSizes(projectId, posterId),
    selection: query,
  };
  return (
    <>
      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="lg:w-1/3 lg:shrink-0">
          <PosterControlsPanel
            nav={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={withQuery(`/${projectId}`, query)} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
                  {project.title}
                </Link>
                <span className="text-neutral-300">/</span>
                <h1 className="text-lg font-bold tracking-tight text-neutral-900">{poster.title}</h1>
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
                  listing={{ ...listing, widthPx: listing.width, heightPx: listing.height }}
                  className="ml-auto"
                />
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
