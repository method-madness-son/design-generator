import Link from "next/link";
import { getPosterIds, getProjects } from "@/lib/posterResolver";

export default function Home() {
  const projects = getProjects();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/typography" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          Typography &rarr;
        </Link>
      </div>
      {projects.length === 0 && (
        <p className="mt-4 text-neutral-600">
          No projects yet. Add a folder with a project.json under posters/.
        </p>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const count = getPosterIds(project.id).length;
          return (
            <li key={project.id}>
              <Link
                href={`/${project.id}`}
                className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
              >
                <h2 className="font-semibold">{project.title}</h2>
                <p className="mt-1 text-sm text-neutral-600">{project.description}</p>
                <p className="mt-3 text-sm text-neutral-500">
                  {count} {count === 1 ? "poster" : "posters"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
