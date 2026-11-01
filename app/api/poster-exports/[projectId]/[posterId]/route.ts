// Saves a studio-rendered print PNG into posters/<projectId>/exports/ (see lib/posterExports.ts).
// This writes to the repo on disk, so it only makes sense for the local studio (`npm run dev`).
import { getPosterIds, getProject } from '@/lib/posterResolver';
import { isPosterSizeName } from '@/lib/posterSizes';
import { removeExport, saveExport, savedSizes } from '@/lib/posterExports';

type Context = { params: Promise<{ projectId: string; posterId: string }> };

async function resolve(context: Context) {
  const { projectId, posterId } = await context.params;
  if (!getProject(projectId) || !getPosterIds(projectId).includes(posterId)) return null;
  return { projectId, posterId };
}

const notFound = () => Response.json({ error: 'No such poster.' }, { status: 404 });

export async function GET(_request: Request, context: Context) {
  const target = await resolve(context);
  if (!target) return notFound();
  return Response.json({ sizes: savedSizes(target.projectId, target.posterId) });
}

export async function POST(request: Request, context: Context) {
  const target = await resolve(context);
  if (!target) return notFound();
  const form = await request.formData();
  const size = String(form.get('size') ?? '');
  const file = form.get('file');
  if (!isPosterSizeName(size)) return Response.json({ error: `Unknown size "${size}".` }, { status: 400 });
  if (!(file instanceof Blob)) return Response.json({ error: 'Missing PNG file.' }, { status: 400 });
  let selection: Record<string, string> = {};
  try {
    const parsed: unknown = JSON.parse(String(form.get('selection') ?? '{}'));
    if (parsed && typeof parsed === 'object') {
      selection = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
    }
  } catch {
    return Response.json({ error: 'selection must be JSON.' }, { status: 400 });
  }
  try {
    const saved = saveExport(target.projectId, target.posterId, size, Buffer.from(await file.arrayBuffer()), selection);
    return Response.json({ saved, sizes: savedSizes(target.projectId, target.posterId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const target = await resolve(context);
  if (!target) return notFound();
  const size = new URL(request.url).searchParams.get('size') ?? '';
  if (!isPosterSizeName(size)) return Response.json({ error: `Unknown size "${size}".` }, { status: 400 });
  removeExport(target.projectId, target.posterId, size);
  return Response.json({ sizes: savedSizes(target.projectId, target.posterId) });
}
