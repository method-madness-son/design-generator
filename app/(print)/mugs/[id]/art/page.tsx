import { notFound } from "next/navigation";
import { MugArtwork } from "@/components/mugs/MugArtwork";
import { getMugDesignIds, loadResolvedMug } from "@/lib/mugDesigns";
import { isMugSize } from "@/lib/mugSizes";

export function generateStaticParams() {
  return getMugDesignIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} — mug print`, robots: { index: false, follow: false } };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function MugArtPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string | string[] }>;
}) {
  const { id } = await params;
  const mug = loadResolvedMug(id);
  if (!mug) notFound();
  const requested = one((await searchParams).size);
  const size = isMugSize(requested) ? requested : "11oz";

  if (mug.errors.length > 0 || !mug.sizes.includes(size) || !mug.textInk) {
    return (
      <div data-mug-error="1" className="p-6 text-sm text-neutral-900">
        <h1 className="text-lg font-semibold">Cannot print {id}</h1>
        <ul className="mt-3 list-disc pl-5">
          {mug.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
          {!mug.sizes.includes(size) ? <li>Size {size} is not on this design.</li> : null}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ background: "transparent" }}>
      <style>{`html, body { background: transparent !important; }`}</style>
      <MugArtwork mug={mug} size={size} capture />
    </div>
  );
}
