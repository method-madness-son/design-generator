import Link from "next/link";
import { getInventory, STATUS_INFO, type InventoryItem, type InventoryStatus } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Inventory",
  description: "Posters that are ready or listed, and ideas still in progress.",
};

// Read from disk on every visit so saves and syncs show up without a rebuild.
export const dynamic = "force-dynamic";

const ORDER: InventoryStatus[] = ["listed", "draft", "ready", "needs-listing", "needs-export", "idea"];

const STATUS_STYLE: Record<InventoryStatus, string> = {
  listed: "bg-emerald-100 text-emerald-800",
  draft: "bg-sky-100 text-sky-800",
  ready: "bg-violet-100 text-violet-800",
  "needs-listing": "bg-amber-100 text-amber-800",
  "needs-export": "bg-amber-50 text-amber-700",
  idea: "bg-neutral-100 text-neutral-600",
};

const byStatus = (a: InventoryItem, b: InventoryItem) =>
  ORDER.indexOf(a.status) - ORDER.indexOf(b.status) ||
  a.projectTitle.localeCompare(b.projectTitle) ||
  a.posterTitle.localeCompare(b.posterTitle);

function StatusPill({ status }: { status: InventoryStatus }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_INFO[status].label}
    </span>
  );
}

function InventoryTable({ items, detail }: { items: InventoryItem[]; detail: "listing" | "next" }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Poster</th>
            <th className="px-4 py-2 font-medium">Project</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Saved sizes</th>
            <th className="px-4 py-2 font-medium">{detail === "listing" ? "Etsy title" : "Next step"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {items.map((item) => (
            <tr key={`${item.projectId}/${item.posterId}`} className="align-top">
              <td className="px-4 py-2">
                <Link href={`/${item.projectId}/${item.posterId}`} className="font-medium text-neutral-900 hover:underline">
                  {item.posterTitle}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-600">{item.projectTitle}</td>
              <td className="px-4 py-2">
                <StatusPill status={item.status} />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-neutral-600">{item.sizes.join(", ") || "—"}</td>
              <td className="px-4 py-2 text-neutral-600">
                {detail === "listing" ? (
                  <span className="line-clamp-2">{item.etsyTitle}</span>
                ) : (
                  <>
                    {STATUS_INFO[item.status].next}
                    {item.status === "needs-listing" && item.etsyTitle && item.listingErrors[0] && (
                      <span className="mt-0.5 block text-xs text-amber-700">{item.listingErrors[0]}</span>
                    )}
                  </>
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
  const stocked = items.filter((item) => STATUS_INFO[item.status].stocked);
  const ideas = items.filter((item) => !STATUS_INFO[item.status].stocked);
  const counts = ORDER.map((status) => [status, items.filter((item) => item.status === status).length] as const);

  return (
    <>
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Inventory</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Every status comes from the pipeline: saved exports, the Etsy listing check, and Printify sync state. Save a
        poster in the studio to make it eligible; it moves up once its listing passes.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {counts.map(([status, count]) => (
          <li key={status} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <StatusPill status={status} /> {count}
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Ready &amp; listed ({stocked.length})</h2>
        {stocked.length > 0 ? (
          <InventoryTable items={stocked} detail="listing" />
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Nothing yet. Open a poster, choose Export Poster → Save for Etsy listing, and make sure its listing passes.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Ideas ({ideas.length})</h2>
        <p className="mt-1 text-sm text-neutral-500">Not listed yet: saved without a listing, listed copy without a saved export, or untouched.</p>
        <InventoryTable items={ideas} detail="next" />
      </section>
    </>
  );
}
