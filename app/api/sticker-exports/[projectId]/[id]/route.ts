// Saves a studio-rendered sticker PNG and the choices behind it (see lib/stickerDesigns.ts).
// It writes to the repo on disk, so it only works for the local studio (`npm run dev`).
import { deleteItem, deleteResponse } from '@/lib/itemDelete';
import { saveSticker } from '@/lib/stickerDesigns';

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  const { projectId, id } = await params;
  return deleteResponse(deleteItem('sticker', projectId, id, new URL(request.url).searchParams.has('force')));
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  const { projectId, id } = await params;
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return fail('Missing PNG file.');
  try {
    saveSticker(projectId, id, Buffer.from(await file.arrayBuffer()), { ...JSON.parse(String(form.get('selection') ?? '{}')), type: String(form.get('type') ?? '') });
    return Response.json({ ok: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
