import Link from "next/link";
import { MugArtwork } from "@/components/mugs/MugArtwork";
import { getMugDesignIds, getMugProjects, loadResolvedMug } from "@/lib/mugDesigns";
import { MUG_CANVASES } from "@/lib/mugSizes";

export const metadata = {
  title: "Mugs",
  description: "White ceramic mug wraps and wireframe previews.",
};

export default function MugsPage() {
  const projects = getMugProjects();
  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Mugs</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        White ceramic wraps for Printify. The 11 oz file is 2475×1155 px. The 15 oz file is generated and marked unverified.
        Print files are built with <code className="text-sm">npm run mug-art</code>.
      </p>
      {projects.map((project) => {
        const ids = getMugDesignIds(project.id);
        return (
          <section key={project.id} className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-900">{project.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">{project.description}</p>
            {ids.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-600">No mugs in this project yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ids.map((id) => {
                  const mug = loadResolvedMug(id);
                  if (!mug) return null;
                  const phrase = mug.lines.map((line) => line.text).join(" / ");
                  return (
                    <li key={id}>
                      <Link href={`/mugs/${id}`} className="block rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-400">
                        <div className="relative h-[120px] overflow-hidden rounded-md border border-neutral-200 bg-white">
                          {mug.errors.length === 0 ? (
                            <div className="absolute top-0 left-0" style={{ transform: "scale(0.1)", transformOrigin: "top left" }}>
                              <MugArtwork mug={mug} size="11oz" />
                            </div>
                          ) : (
                            <p className="p-3 text-xs text-neutral-700">{mug.errors[0]}</p>
                          )}
                        </div>
                        <h3 className="mt-3 font-semibold text-neutral-900">{phrase || id}</h3>
                        <p className="mt-1 text-xs text-neutral-500">
                          {mug.wrap} · {mug.sizes.map((size) => MUG_CANVASES[size].label).join(", ")}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
