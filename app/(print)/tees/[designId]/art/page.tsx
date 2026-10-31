import { notFound } from "next/navigation";
import { TeePrintCanvas } from "@/components/tees/TeePrintCanvas";
import { getTeeDesignIds, loadResolvedTee } from "@/lib/teeDesigns";
import type { InkSetName } from "@/types/theme";

export function generateStaticParams() {
  return getTeeDesignIds().map((designId) => ({ designId }));
}

export async function generateMetadata({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  return { title: `${designId} — tee print`, robots: { index: false, follow: false } };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function TeeArtPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ ink?: string | string[] }>;
}) {
  const { designId } = await params;
  const tee = loadResolvedTee(designId);
  if (!tee) notFound();
  const inkSet: InkSetName = one((await searchParams).ink) === "on-dark" ? "on_dark_shirt" : "on_light_shirt";

  if (tee.errors.length > 0 || !tee.inkBySet[inkSet]) {
    return (
      <div data-tee-error="1" className="p-6 text-sm text-neutral-900">
        <h1 className="text-lg font-semibold">Cannot print {tee.id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {tee.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ background: "transparent" }}>
      <TeePrintCanvas tee={tee} inkSet={inkSet} />
    </div>
  );
}
