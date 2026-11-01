// Saves a studio-rendered print PNG into posters/<projectId>/<posterId>/exports/ (see lib/posterExports.ts).
// It writes to the repo on disk, so it only works for the local studio (`npm run dev`).
import { saveExport } from '@/lib/posterExports';
import { getPosterFile, getProject, getValidSelection } from '@/lib/posterResolver';
import { isPosterSizeName } from '@/lib/posterSizes';

const fail = (error: string, status = 400) => Response.json({ error }, { status });

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
