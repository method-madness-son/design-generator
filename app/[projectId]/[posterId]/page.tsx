import Link from "next/link";
import { notFound } from "next/navigation";
import { EtsyPromo } from "@/components/EtsyPromo";
import { ExportButton } from "@/components/ExportButton";
import { PinterestPromo } from "@/components/PinterestPromo";
import { PinterestTeaser } from "@/components/PinterestTeaser";
import { PosterCanvas } from "@/components/PosterCanvas";
import { PosterVariantSelects } from "@/components/PosterVariantSelects";
import { getProject, getResolvedPoster, getValidSelection } from "@/lib/posterResolver";
import { withQuery } from "@/lib/utils";

const CANVAS_ID = "print-canvas";

export default async function PosterPage({ params, searchParams }: PageProps<"/[projectId]/[posterId]">) {
  const { projectId, posterId } = await params;
  const { palette, fonts, iconRem, titleRem, subtitleRem } = await searchParams;
  const project = getProject(projectId);
  if (!project) notFound();

  const query = getValidSelection(project, {
    palette: String(palette ?? ""),
    fonts: String(fonts ?? ""),
    iconRem: String(iconRem ?? ""),
    titleRem: String(titleRem ?? ""),
    subtitleRem: String(subtitleRem ?? ""),
  });
  const poster = getResolvedPoster(projectId, posterId, query);
  if (!poster) notFound();

  const [ratioWidth, ratioHeight] = poster.aspectRatio.split("/").map(Number);
  const printHeightInches = (poster.printWidthInches * ratioHeight) / ratioWidth;
  const details = [
    ["Aspect ratio", poster.aspectRatio.replace("/", ":")],
    ["Print size", `${poster.printWidthInches} × ${printHeightInches} in`],
    ["Export size", `${poster.printWidthInches * 300} × ${Math.round(printHeightInches * 300)} px`],
  ];

  return (
    <>
      <Link href={withQuery(`/${projectId}`, query)} className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {project.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{poster.title}</h1>

      <div className="mt-6 flex flex-wrap items-start gap-6">
        <div className="max-w-full overflow-auto rounded-lg bg-neutral-100 p-8">
          <PosterCanvas poster={poster} id={CANVAS_ID} />
        </div>

        <aside className="w-64 rounded-lg border border-neutral-200 bg-white p-4">
          <dl className="mb-4 space-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-neutral-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mb-4">
            <PosterVariantSelects project={project} query={query} />
          </div>
          <ExportButton
            elementId={CANVAS_ID}
            filename={[projectId, posterId, poster.fontsName].filter(Boolean).join("-")}
            paletteName={poster.paletteName}
            palettes={project.palettes ?? {}}
            printWidthInches={poster.printWidthInches}
          />
        </aside>
      </div>

      {(poster.pinterest || poster.etsy) && (
        <div className="mt-6 flex flex-wrap items-start gap-6">
          {poster.pinterest && <PinterestTeaser poster={poster} />}
          <div className="max-w-xl flex-1 space-y-3">
            {poster.pinterest && <PinterestPromo pinterest={poster.pinterest} />}
            {poster.etsy && <EtsyPromo etsy={poster.etsy} />}
          </div>
        </div>
      )}
    </>
  );
}
