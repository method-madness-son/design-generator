import Link from "next/link";
import { PosterThumbnail } from "@/components/PosterThumbnail";
import { getPosterIds, getProjects, getResolvedPoster } from "@/lib/posterResolver";

export default function Home() {
  const projects = getProjects();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex items-center gap-4">
          <Link href="/tees" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Tees &rarr;
          </Link>
          <Link href="/mugs" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Mugs &rarr;
          </Link>
          <Link href="/kdp" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            KDP wireframes &rarr;
          </Link>
          <Link href="/lowcontent" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Low-content books &rarr;
          </Link>
          <Link href="/typography" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Typography &rarr;
          </Link>
        </div>
      </div>
      {projects.length === 0 && (
        <p className="mt-4 text-neutral-600">
          No projects yet. Add a folder with a project.json under posters/.
        </p>
      )}
      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {projects.map((project) => {
          const posterIds = getPosterIds(project.id);
          const count = posterIds.length;
          const firstPoster = count > 0 ? getResolvedPoster(project.id, posterIds[0]) : null;

          return (
            <li key={project.id}>
              <Link
                href={`/${project.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
              >
                {firstPoster && (
                  <div className="overflow-hidden rounded-lg bg-neutral-100">
                    <PosterThumbnail poster={firstPoster} />
                  </div>
                )}
                <div className="mt-3 flex flex-1 flex-col justify-between">
                  <div>
                    <h2 className="font-semibold text-neutral-900 group-hover:text-black">
                      {project.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                      {project.description}
                    </p>
                  </div>
                  <p className="mt-3 text-xs font-medium text-neutral-400">
                    {count} {count === 1 ? "poster" : "posters"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
