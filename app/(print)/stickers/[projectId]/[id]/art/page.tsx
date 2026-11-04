import { notFound } from "next/navigation";
import { PosterCanvas } from "@/components/PosterCanvas";
import { StickerFitReport } from "@/components/stickers/StickerFitReport";
import { loadSticker } from "@/lib/stickerDesigns";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} — sticker print`, robots: { index: false, follow: false } };
}

// The saved design. `npm run sticker:fit` tries other types and sizes through the URL.
export default async function StickerArtPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { projectId, id } = await params;
  const sticker = loadSticker(projectId, id, await searchParams);
  if (!sticker) notFound();
  return (
    <>
      <PosterCanvas poster={sticker.poster} id="sticker-art" />
      <StickerFitReport canvasId="sticker-art" type={sticker.type} signature={id} hidden />
    </>
  );
}
