import Link from "next/link";
import { notFound } from "next/navigation";
import { MugWireframe } from "@/components/mugs/MugWireframe";
import { getMugDesignIds, loadResolvedMug } from "@/lib/mugDesigns";
import { MUG_CANVASES, isMugSize } from "@/lib/mugSizes";

export function generateStaticParams() {
  return getMugDesignIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mug = loadResolvedMug(id);
  const phrase = mug?.lines.map((line) => line.text).join(" / ");
  return { title: phrase ? `${phrase} — mug` : "Mug" };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function MugDetailPage({
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
  const canvas = MUG_CANVASES[size];
  const phrase = mug.lines.map((line) => line.text).join(" / ");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/mugs" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Mugs
        </Link>
        <div className="flex gap-3 text-sm">
          {mug.sizes.map((option) => (
            <Link
              key={option}
              href={option === "11oz" ? `/mugs/${id}` : `/mugs/${id}?size=${option}`}
              className={option === size ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}
            >
              {MUG_CANVASES[option].label}
              {MUG_CANVASES[option].verified ? "" : " · unverified"}
            </Link>
          ))}
        </div>
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{phrase}</h1>
      <p className="mt-1 text-neutral-600">
        {mug.projectTitle} · {mug.paletteLabel} · {mug.fonts.display} / {mug.fonts.supporting}
      </p>
      {mug.textInk ? (
        <p className="mt-1 text-sm text-neutral-600">
          Text {mug.textInk.hex} ({mug.textInk.contrastOnWhite}:1 on {mug.blankHex}) · graphic {mug.graphicInk?.hex}
        </p>
      ) : null}
      {!canvas.verified ? (
        <p className="mt-3 max-w-2xl rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-800">
          {canvas.sourceNote}
        </p>
      ) : null}
      {mug.errors.length > 0 ? (
        <ul className="mt-4 list-disc pl-5 text-sm text-neutral-800">
          {mug.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <MugWireframe mug={mug} size={size} />
        </div>
      )}
      {mug.warnings.length > 0 ? (
        <ul className="mt-4 list-disc pl-5 text-xs text-neutral-500">
          {mug.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Etsy</h2>
        <p className="mt-2 text-sm font-medium text-neutral-900">{mug.etsy.title}</p>
        <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-700">{mug.etsy.description}</p>
        <p className="mt-2 text-sm text-neutral-600">{mug.etsy.category}</p>
        <p className="mt-2 text-sm text-neutral-600">
          Tags ({mug.etsy.tags.length}/13): {mug.etsy.tags.join(", ")}
        </p>
      </section>
    </>
  );
}
