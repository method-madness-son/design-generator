// Saves a studio-rendered print PNG into posters/<projectId>/<posterId>/exports/ (see lib/posterExports.ts).
// It writes to the repo on disk, so it only works for the local studio (`npm run dev`).
import fs from 'node:fs';
import { deleteItem, deleteResponse } from '@/lib/itemDelete';
import { exportPath, savedSizes, saveExport } from '@/lib/posterExports';
import { getPosterFile, getProject, getValidSelection } from '@/lib/posterResolver';
import { isPosterSizeName } from '@/lib/posterSizes';

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string; posterId: string }> }) {
  const { projectId, posterId } = await params;
  const url = new URL(request.url);
  const size = url.searchParams.get('size');
  const variant = url.searchParams.get('variant') ?? '';
  if (!size || !isPosterSizeName(size)) return fail('Missing or invalid size param.', 400);
  const sizes = savedSizes(projectId, posterId);
  if (!sizes.includes(size)) return fail('No export for that size.', 404);
  const filePath = exportPath(projectId, posterId, size, variant);
  if (!fs.existsSync(filePath)) return fail('Export file not found.', 404);
  const data = fs.readFileSync(filePath);
  return new Response(data, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string; posterId: string }> }) {
  const { projectId, posterId } = await params;
  return deleteResponse(deleteItem('poster', projectId, posterId, new URL(request.url).searchParams.has('force')));
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string; posterId: string }> }) {
  const { projectId, posterId } = await params;
  const project = getProject(projectId);
  if (!project || !getPosterFile(projectId, posterId)) return fail('No such poster.', 404);

  const form = await request.formData();
  const size = String(form.get('size') ?? '');
  const file = form.get('file');
  if (!isPosterSizeName(size)) return fail(`Unknown size "${size}".`);
  if (!(file instanceof Blob)) return fail('Missing PNG file.');
  let selection: Record<string, string>;
  try {
    // Keep only selections the studio can reproduce.
    const valid = getValidSelection(project, JSON.parse(String(form.get('selection') ?? '{}')));
    selection = Object.fromEntries(Object.entries(valid).filter(([, value]) => value));
  } catch {
    return fail('selection must be JSON.');
  }
  try {
    const sizes = saveExport(projectId, posterId, size, Buffer.from(await file.arrayBuffer()), selection);
    return Response.json({ sizes });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
