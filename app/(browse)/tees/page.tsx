import Link from "next/link";
import { TeeWireframe } from "@/components/tees/TeeWireframe";
import { defaultPreviewShirt, getTeeProjects, loadAllResolvedTees } from "@/lib/teeDesigns";
import { resolveShirt } from "@/lib/theme";

export const metadata = {
  title: "Tee designs",
  description: "Print-ready tee artwork and wireframe previews.",
};

export default function TeeIndexPage() {
  const projects = getTeeProjects();
  const tees = loadAllResolvedTees();

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Tee designs</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Front prints for a unisex tee. Artwork is a transparent PNG at the Printify full-chest canvas. The wireframe
        shows where that art sits. Print files are built with <code className="text-sm">npm run tee-art</code>.
      </p>
      {projects.length === 0 ? (
        <p className="mt-4 text-neutral-600">No tee projects yet. Add a folder with a project.json under tees/.</p>
      ) : null}
      {projects.map((project) => {
        const designs = tees.filter((tee) => tee.projectId === project.id);
        return (
          <section key={project.id} className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-900">{project.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">{project.description}</p>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((tee) => {
                const shirtName = defaultPreviewShirt(tee);
                const shirt = resolveShirt(shirtName).shirt;
                const inkSet = shirt?.is_dark ? "on_dark_shirt" : "on_light_shirt";
                return (
                  <li key={tee.id}>
                    <Link
                      href={`/tees/${tee.id}`}
                      className="block rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
                    >
                      {shirt ? (
                        <div className="flex justify-center overflow-hidden rounded-lg bg-neutral-50">
                          <TeeWireframe tee={tee} shirt={shirt} inkSet={inkSet} widthPx={240} guides={false} />
                        </div>
                      ) : null}
                      <h3 className="mt-2 font-semibold text-neutral-900">{tee.lines.map((line) => line.text).join(" ")}</h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        {tee.paletteLabel} · {tee.placement.label}
                        {tee.marketStatus === "proposed_unverified" ? " · proposed_unverified" : ""}
                      </p>
                      {tee.errors.length > 0 ? <p className="mt-2 text-xs text-neutral-700">{tee.errors[0]}</p> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
