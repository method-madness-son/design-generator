import { notFound } from "next/navigation";
import { TeeWireframe } from "@/components/tees/TeeWireframe";
import { getTeeDesignIds, loadResolvedTee } from "@/lib/teeDesigns";
import { resolveShirt } from "@/lib/theme";
import type { InkSetName } from "@/types/theme";

export function generateStaticParams() {
  return getTeeDesignIds().map((designId) => ({ designId }));
}

export async function generateMetadata({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  return { title: `${designId} — tee wireframe`, robots: { index: false, follow: false } };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function TeePreviewExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ shirt?: string | string[] }>;
}) {
  const { designId } = await params;
  const tee = loadResolvedTee(designId);
  if (!tee) notFound();
  const requested = one((await searchParams).shirt) || "White";
  const resolved = resolveShirt(requested);
  const shirt = resolved.shirt;
  if (!shirt || tee.errors.length > 0) {
    return (
      <div data-tee-error="1" className="bg-white p-6 text-sm text-neutral-900">
        <h1 className="text-lg font-semibold">Cannot preview {tee.id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {tee.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
          {!shirt ? <li>Unknown shirt {requested}.</li> : null}
        </ul>
      </div>
    );
  }
  const inkSet: InkSetName = shirt.is_dark ? "on_dark_shirt" : "on_light_shirt";

  return (
    <div
      data-tee-preview="1"
      data-tee-id={tee.id}
      data-shirt={shirt.name}
      style={{ width: 880, background: "#ffffff", padding: 28 }}
    >
      <TeeWireframe tee={tee} shirt={shirt} inkSet={inkSet} widthPx={520} guides />
      <p style={{ margin: "12px 0 0", fontFamily: "ui-sans-serif, sans-serif", fontSize: 16, color: "#222" }}>
        {shirt.name} · {tee.placement.label} {tee.print.box.widthIn}×{tee.print.box.heightIn} in · print area{" "}
        {tee.print.widthIn}×{tee.print.heightIn} in
      </p>
      <p style={{ margin: "4px 0 0", fontFamily: "ui-sans-serif, sans-serif", fontSize: 13, color: "#444" }}>
        Guides and labels are preview-only. They are not in the print file.
      </p>
    </div>
  );
}
