import { notFound } from "next/navigation";
import { MugWireframe } from "@/components/mugs/MugWireframe";
import { getMugDesignIds, loadResolvedMug } from "@/lib/mugDesigns";
import { isMugSize } from "@/lib/mugSizes";

export function generateStaticParams() {
  return getMugDesignIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} — mug preview`, robots: { index: false, follow: false } };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function MugPreviewPage({
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
  const size = isMugSize(requested) && mug.sizes.includes(requested) ? requested : (mug.sizes[0] ?? "11oz");
  if (mug.errors.length > 0 || !mug.textInk) {
    return (
      <div data-mug-error="1" className="p-6 text-sm">
        {mug.errors.join(" ")}
      </div>
    );
  }
  return <MugWireframe mug={mug} size={size} capture />;
}
