import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CANVAS_WIDTH, PosterCanvas } from "@/components/PosterCanvas";
import { ProductTable, type ProductRow } from "@/components/ProductTable";
import { getInventory, STATUS_INFO, STATUS_ORDER, type InventoryItem } from "@/lib/inventory";
import { getResolvedPoster } from "@/lib/posterResolver";

export const dynamic = "force-dynamic";

const THUMB_W = 150;

function PosterThumb({ item }: { item: InventoryItem }) {
  const [projectId, posterId] = item.key.split("/");
  if (item.detail) {
    const firstSize = item.detail.split(", ")[0];
    return (
      <img
        src={`/api/poster-exports/${projectId}/${posterId}?size=${firstSize}`}
        alt={item.title}
        className="w-[150px] object-contain"
      />
    );
  }
  const poster = getResolvedPoster(projectId, posterId);
  if (!poster) return null;
  return (
    <div className="relative" style={{ width: THUMB_W, aspectRatio: poster.aspectRatio.replace('/', ' / '), overflow: "hidden" }}>
      <div style={{ transform: `scale(${THUMB_W / CANVAS_WIDTH})`, transformOrigin: "top left" }}>
        <PosterCanvas poster={poster} />
      </div>
      <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
        Preview
      </span>
    </div>
  );
}

const PRINTIFY_SHOP_ID = 29566612;

const toRow = (item: InventoryItem): ProductRow => ({
  id: item.key,
  href: item.href,
  title: item.title,
  project: item.project,
  status: { label: STATUS_INFO[item.status].label, style: STATUS_INFO[item.status].style },
  needs: { metadata: item.needsMetadata, export: item.needsExport },
  detail: item.detail,
  etsyUrl: item.etsyUrl,
  printifyUrl: item.productId ? `https://printify.com/app/editor/${PRINTIFY_SHOP_ID}/${item.productId}` : undefined,
  thumbnail: <PosterThumb item={item} />,
});

export default function Home() {
  const items = getInventory().filter((item) => item.productType === "poster");
  const groups = STATUS_ORDER.map((status) => ({ status, rows: items.filter((item) => item.status === status).map(toRow) }));

  return (
    <>
      <Breadcrumbs items={[{ label: "Posters" }]} />
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Posters</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/inventory" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Inventory
          </Link>
          <Link href="/tees" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Tees
          </Link>
          <Link href="/mugs" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Mugs
          </Link>
          <Link href="/stickers" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Stickers
          </Link>
          <Link href="/wrapping" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Wrapping
          </Link>
          <Link href="/kdp" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            KDP
          </Link>
          <Link href="/design" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Design
          </Link>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        {groups.map(({ status, rows }) => `${rows.length} ${STATUS_INFO[status].label.toLowerCase()}`).join(" · ")} · {items.length} total
      </p>

      {groups.map(({ status, rows }) =>
        rows.length > 0 ? (
          <section key={status} className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-900">
              {STATUS_INFO[status].label} ({rows.length})
            </h2>
            <ProductTable rows={rows} />
          </section>
        ) : null,
      )}
    </>
  );
}
