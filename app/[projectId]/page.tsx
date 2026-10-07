import Link from "next/link";
import { notFound } from "next/navigation";
import { CANVAS_WIDTH, PosterCanvas } from "@/components/PosterCanvas";
import { PosterVariantSelects } from "@/components/PosterVariantSelects";
import { getProject, getResolvedPosters, getValidSelection } from "@/lib/posterResolver";
import { withQuery } from "@/lib/utils";

const THUMBNAIL_SCALE = 0.5;

export default async function ProjectPage({ params, searchParams }: PageProps<"/[projectId]">) {
  const { projectId } = await params;
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
  const posters = getResolvedPosters(projectId, query);

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{project.title}</h1>
      <p className="mt-1 text-neutral-600">{project.description}</p>
      <div className="mt-4">
        <PosterVariantSelects project={project} query={query} />
      </div>

      <ul className="mt-6 flex flex-wrap gap-4">
        {posters.map((poster) => (
          <li key={poster.id}>
            <Link
              href={withQuery(`/${projectId}/${poster.id}`, query)}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
            >
              <div
                className="overflow-hidden"
                style={{
                  width: CANVAS_WIDTH * THUMBNAIL_SCALE,
                  aspectRatio: poster.aspectRatio.replace("/", " / "),
                }}
              >
                <div className="origin-top-left" style={{ transform: `scale(${THUMBNAIL_SCALE})` }}>
                  <PosterCanvas poster={poster} />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium">{poster.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
