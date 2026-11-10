import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MugArtwork } from "@/components/mugs/MugArtwork";
import { ProductTable, STATUS_STYLES, type ProductRow } from "@/components/ProductTable";
import { getMugDesignIds, getMugProjects, loadResolvedMug } from "@/lib/mugDesigns";
import { MUG_CANVASES } from "@/lib/mugSizes";
import type { ResolvedMug } from "@/types/mug";

export const metadata = {
  title: "Mugs",
  description: "White ceramic mug wraps and wireframe previews.",
};

function MugThumb({ mug }: { mug: ResolvedMug }) {
  if (mug.errors.length > 0) return null;
  return (
    <div className="relative w-[150px] overflow-hidden" style={{ height: 70 }}>
      <div className="absolute top-0 left-0" style={{ transform: "scale(0.0606)", transformOrigin: "top left" }}>
        <MugArtwork mug={mug} size="11oz" />
      </div>
    </div>
  );
}

function mugStatus(mug: ResolvedMug): ProductRow["status"] {
  if (mug.errors.length > 0) return { label: "Has errors", style: STATUS_STYLES.warning };
  if (mug.marketStatus === "proposed_unverified") return { label: "Unverified", style: STATUS_STYLES.warning };
  return { label: "Ready", style: STATUS_STYLES.ready };
}

export default function MugsPage() {
  const projects = getMugProjects();
  const rows: ProductRow[] = [];
  for (const project of projects) {
    for (const id of getMugDesignIds(project.id)) {
      const mug = loadResolvedMug(id);
      if (!mug) continue;
      rows.push({
        id,
        href: `/mugs/${id}`,
        title: mug.lines.map((line) => line.text).join(" / ") || id,
        project: project.title,
        status: mugStatus(mug),
        detail: `${mug.wrap} · ${mug.sizes.map((size) => MUG_CANVASES[size].label).join(", ")}`,
        thumbnail: <MugThumb mug={mug} />,
      });
    }
  }
  return (
    <>
      <Breadcrumbs items={[{ label: "Mugs" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Mugs</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        White ceramic wraps for Printify. The 11 oz file is 2475×1155 px. The 15 oz file is generated and marked unverified.
        Print files are built with <code className="text-sm">npm run mug-art</code>.
      </p>
      <p className="mt-2 text-sm text-neutral-500">{rows.length} designs</p>
      <ProductTable rows={rows} />
    </>
  );
}
