import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductTable, STATUS_STYLES, type ProductRow } from "@/components/ProductTable";
import { TeeWireframe } from "@/components/tees/TeeWireframe";
import { defaultPreviewShirt, loadAllResolvedTees } from "@/lib/teeDesigns";
import { resolveShirt } from "@/lib/theme";
import type { ResolvedTee } from "@/types/tee";

export const metadata = {
  title: "Tee designs",
  description: "Print-ready tee artwork and wireframe previews.",
};

function TeeThumb({ tee }: { tee: ResolvedTee }) {
  const shirtName = defaultPreviewShirt(tee);
  const shirt = resolveShirt(shirtName).shirt;
  if (!shirt) return null;
  const inkSet = shirt.is_dark ? "on_dark_shirt" as const : "on_light_shirt" as const;
  return (
    <div className="flex w-[150px] items-center justify-center overflow-hidden">
      <TeeWireframe tee={tee} shirt={shirt} inkSet={inkSet} widthPx={150} guides={false} />
    </div>
  );
}

function teeStatus(tee: ResolvedTee): ProductRow["status"] {
  if (tee.errors.length > 0) return { label: "Has errors", style: STATUS_STYLES.warning };
  if (tee.marketStatus === "proposed_unverified") return { label: "Unverified", style: STATUS_STYLES.warning };
  return { label: "Ready", style: STATUS_STYLES.ready };
}

export default function TeeIndexPage() {
  const tees = loadAllResolvedTees();
  const rows: ProductRow[] = tees.map((tee) => ({
    id: tee.id,
    href: `/tees/${tee.id}`,
    title: tee.lines.map((line) => line.text).join(" "),
    project: tee.projectTitle,
    status: teeStatus(tee),
    detail: `${tee.paletteLabel} · ${tee.placement.label}`,
    thumbnail: <TeeThumb tee={tee} />,
  }));

  return (
    <>
      <Breadcrumbs items={[{ label: "Tees" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Tee designs</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Front prints for a unisex tee. Artwork is a transparent PNG at the Printify full-chest canvas. The wireframe
        shows where that art sits. Print files are built with <code className="text-sm">npm run tee-art</code>.
      </p>
      <p className="mt-2 text-sm text-neutral-500">{rows.length} designs</p>
      <ProductTable rows={rows} />
    </>
  );
}
