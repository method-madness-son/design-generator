import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NeedsCell } from "@/components/ProductTable";
import { getInventory, PRODUCT_TYPE_LABELS, STATUS_INFO, STATUS_ORDER, type InventoryItem, type InventoryStatus } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Inventory",
  description: "All products: posters, stickers, mugs, tees, and wrapping paper.",
};

export const dynamic = "force-dynamic";

const TYPE_STYLE: Record<string, string> = {
  poster: "bg-blue-50 text-blue-700",
  sticker: "bg-pink-50 text-pink-700",
  mug: "bg-orange-50 text-orange-700",
  tee: "bg-green-50 text-green-700",
  wrapping: "bg-purple-50 text-purple-700",
};

const byStatus = (a: InventoryItem, b: InventoryItem) =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
  a.productType.localeCompare(b.productType) ||
  a.project.localeCompare(b.project) ||
  a.title.localeCompare(b.title);

function StatusPill({ status }: { status: InventoryStatus }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", STATUS_INFO[status].style)}>
      {STATUS_INFO[status].label}
    </span>
  );
}

function InventoryTable({ items, detail }: { items: InventoryItem[]; detail: "listing" | "next" }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Product</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Project</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Needs Metadata</th>
            <th className="px-4 py-2 font-medium">Needs Export</th>
            <th className="px-4 py-2 font-medium">Details</th>
            <th className="px-4 py-2 font-medium">{detail === "listing" ? "Etsy title" : "Next step"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {items.map((item) => (
            <tr key={item.key} className="align-top">
              <td className="px-4 py-2">
                {item.etsyUrl ? (
                  <a href={item.etsyUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    {item.title} ↗
                  </a>
                ) : (
                  <Link href={item.href} className="font-medium text-neutral-900 hover:underline">
                    {item.title}
                  </Link>
                )}
              </td>
              <td className="px-4 py-2">
                <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TYPE_STYLE[item.productType] ?? "bg-neutral-100 text-neutral-600")}>
                  {PRODUCT_TYPE_LABELS[item.productType]}
                </span>
              </td>
              <td className="px-4 py-2 text-neutral-600">{item.project}</td>
              <td className="px-4 py-2">
                <StatusPill status={item.status} />
              </td>
              <td className="px-4 py-2">
                <NeedsCell needed={item.needsMetadata} />
              </td>
              <td className="px-4 py-2">
                <NeedsCell needed={item.needsExport} />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-neutral-600">
                {item.detail ?? "—"}
              </td>
              <td className="px-4 py-2 text-neutral-600">
                {detail === "listing" ? (
                  <span className="line-clamp-2">{item.etsyTitle}</span>
                ) : (
                  STATUS_INFO[item.status].next
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryPage() {
  const items = getInventory().sort(byStatus);
  const stocked = items.filter((item) => item.status === "published" || item.status === "ready");
  const ideas = items.filter((item) => item.status === "draft" || item.status === "idea");
  const counts = STATUS_ORDER.map((status) => [status, items.filter((item) => item.status === status).length] as const);

  return (
    <>
      <Breadcrumbs items={[{ label: "Inventory" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Inventory</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        All products across the shop. Every status comes from the pipeline: saved exports, Etsy listing checks, and
        Printify sync state.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {counts.map(([status, count]) => (
          <li key={status} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <StatusPill status={status} /> {count}
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Published &amp; ready to publish ({stocked.length})</h2>
        {stocked.length > 0 ? (
          <InventoryTable items={stocked} detail="listing" />
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Nothing yet. Export a product and make sure its Etsy copy passes the check.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Drafts &amp; ideas ({ideas.length})</h2>
        <p className="mt-1 text-sm text-neutral-500">Drafts have an export or Etsy metadata but not both; the Needs columns show what is missing.</p>
        <InventoryTable items={ideas} detail="next" />
      </section>
    </>
  );
}
