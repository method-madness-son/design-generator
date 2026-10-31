import Link from "next/link";
import { notFound } from "next/navigation";
import { TeeWireframe } from "@/components/tees/TeeWireframe";
import { getTeeDesignIds, loadResolvedTee, shirtSlug } from "@/lib/teeDesigns";
import { PREVIEW_SHIRT_NAMES, listShirts, resolveShirt } from "@/lib/theme";
import type { InkSetName } from "@/types/theme";
import { withQuery } from "@/lib/utils";

export function generateStaticParams() {
  return getTeeDesignIds().map((designId) => ({ designId }));
}

export async function generateMetadata({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const tee = loadResolvedTee(designId);
  const title = tee?.lines.map((line) => line.text).join(" ") ?? "Tee design";
  return { title: `${title} — tee preview` };
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function TeeDesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ shirt?: string | string[] }>;
}) {
  const { designId } = await params;
  const tee = loadResolvedTee(designId);
  if (!tee) notFound();

  const requested = one((await searchParams).shirt);
  const shirtName = requested || tee.shirts[0] || "White";
  const resolvedShirt = resolveShirt(shirtName);
  const shirt = resolvedShirt.shirt ?? resolveShirt("White").shirt;
  if (!shirt) notFound();
  const inkSet: InkSetName = shirt.is_dark ? "on_dark_shirt" : "on_light_shirt";
  const ink = tee.inkBySet[inkSet];
  const intended = tee.shirts.includes(shirt.name);
  const previewNames = new Set<string>(PREVIEW_SHIRT_NAMES);
  const shirts = [...listShirts()].sort((a, b) => Number(previewNames.has(b.name)) - Number(previewNames.has(a.name)));

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/tees" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Tee designs
        </Link>
        <Link
          href={`/tees/${tee.id}/art?ink=${inkSet === "on_dark_shirt" ? "on-dark" : "on-light"}`}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Open print file →
        </Link>
      </div>

      <h1 className="mt-2 text-2xl font-semibold">{tee.lines.map((line) => line.text).join(" ")}</h1>
      <p className="mt-1 text-neutral-600">
        {tee.projectTitle} · {tee.paletteLabel} · {tee.placement.label}
        {tee.marketStatus === "proposed_unverified" ? " · proposed_unverified" : ""}
      </p>

      {tee.errors.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-800">
          {tee.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {tee.warnings.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-700">
          {tee.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {shirts.map((option) => {
          const active = option.name === shirt.name;
          const listed = tee.shirts.includes(option.name);
          return (
            <Link
              key={option.name}
              href={withQuery(`/tees/${tee.id}`, { shirt: option.name })}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                active ? "border-neutral-900 bg-white" : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
              aria-current={active ? "true" : undefined}
            >
              <span className="inline-block h-3 w-3 rounded-full border border-neutral-400" style={{ background: option.hex }} />
              {option.name}
              {listed ? "" : " · extra"}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 max-w-xl rounded-xl border border-neutral-200 bg-white p-4">
        <TeeWireframe tee={tee} shirt={shirt} inkSet={inkSet} widthPx={460} guides />
        <p className="mt-2 text-sm text-neutral-700">
          {shirt.name}
          {shirt.source === "added_for_preview" ? " (preview color, approximate hex)" : " (approximate hex)"} ·{" "}
          {tee.placement.label} {tee.print.box.widthIn}×{tee.print.box.heightIn} in inside a {tee.print.widthIn}×
          {tee.print.heightIn} in print area. Guides are preview-only.
        </p>
        {ink ? (
          <p className="mt-1 text-sm text-neutral-600">
            Ink {ink.text.name} {ink.text.hex}
            {ink.text.wcag ? ` · ${ink.text.wcag}` : ""}
            {ink.text.contrastRatio ? ` · ${ink.text.contrastRatio}:1 vs Ivory/Pepper` : ""}
          </p>
        ) : null}
        {!intended ? <p className="mt-1 text-sm text-neutral-600">This design does not list {shirt.name}.</p> : null}
        {resolvedShirt.warning ? <p className="mt-1 text-sm text-neutral-600">{resolvedShirt.warning}</p> : null}
        {shirt.name !== "Ivory" && shirt.name !== "Pepper" ? (
          <p className="mt-1 text-sm text-neutral-500">
            Contrast ratios in the theme were computed against Ivory and Pepper, not this shirt.
          </p>
        ) : null}
      </div>

      <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <Spec term="Fonts" value={`${tee.fonts.display} + ${tee.fonts.supporting}`} />
        <Spec term="Market" value={`${tee.market}${tee.marketStatus ? ` · ${tee.marketStatus}` : ""}`} />
        <Spec term="Palette" value={`${tee.paletteLabel}${tee.paletteStatus ? ` · ${tee.paletteStatus}` : ""}`} />
        <Spec term="Shirts" value={tee.shirts.join(", ")} />
        <Spec term="Etsy title" value={tee.etsy.title} />
        <Spec term="Etsy category" value={tee.etsy.category} />
      </dl>
      <p className="mt-3 max-w-3xl text-sm text-neutral-600">Tags ({tee.etsy.tags.length}/13): {tee.etsy.tags.join(", ")}</p>
      <p className="mt-3 max-w-3xl text-xs text-neutral-500">Preview file slug: {shirtSlug(shirt.name)}</p>
    </>
  );
}

function Spec({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{term}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </div>
  );
}
