import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PosterThumbnail } from "@/components/PosterThumbnail";
import { ListingBadge } from "@/components/ListingBadge";
import { savedSizesByPoster } from "@/lib/posterExports";
import { getProject, getResolvedPosters, getValidSelection } from "@/lib/posterResolver";
import { loadState } from "@/lib/printify/posters";
import { withQuery } from "@/lib/utils";

export default async function ProjectPage({ params, searchParams }: PageProps<"/[projectId]">) {
  const { projectId } = await params;
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
  const posters = getResolvedPosters(projectId, query);
  const saved = savedSizesByPoster(projectId);
  const state = loadState();
  const printify = Object.assign({}, ...Object.values(state.shops).map((shop) => shop.posters));

  return (
    <>
      <Breadcrumbs items={[{ label: "Posters", href: "/" }, { label: project.title }]} />
      <h1 className="mt-2 text-2xl font-semibold">{project.title}</h1>
      <p className="mt-1 text-neutral-600">{project.description}</p>

      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posters.map((poster) => (
          <li key={poster.id}>
            <Link
              href={withQuery(`/${projectId}/${poster.id}`, query)}
              className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
            >
              <div className="overflow-hidden rounded-lg">
                <PosterThumbnail poster={poster} />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-900 group-hover:text-black">
                {poster.title}
              </p>
              <div className="mt-1">
                {(() => {
                  const synced = printify[`${projectId}/${poster.id}`] as { publishedAt?: string; productId?: string; images?: Record<string, unknown> } | undefined;
                  return (
                    <ListingBadge
                      sizes={saved.get(poster.id) ?? []}
                      hasEtsy={!!poster.etsy}
                      status={
                        synced?.publishedAt ? 'published'
                        : synced?.productId ? 'ready'
                        : undefined
                      }
                      listedSizes={synced?.productId && synced.images ? Object.keys(synced.images) : undefined}
                    />
                  );
                })()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

