import fs from 'node:fs';
import { loadBook } from '@/lib/lowcontent/books';
import { lcExportFiles, lcExportPath, savedElements, saveLcExport } from '@/lib/lowcontent/exports';

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const url = new URL(request.url);
  const elementId = url.searchParams.get('element');

  if (elementId) {
    const filePath = lcExportPath(bookId, elementId);
    if (!filePath || !fs.existsSync(filePath)) return fail('Export not found.', 404);
    const data = fs.readFileSync(filePath);
    return new Response(data, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  }

  return Response.json({ elements: savedElements(bookId), files: lcExportFiles(bookId).map((f) => ({ elementId: f.elementId, bytes: f.bytes })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book?.manifest) return fail('Book not found.', 404);

  const form = await request.formData();
  const elementId = String(form.get('elementId') ?? '');
  const file = form.get('file');
  if (!elementId) return fail('Missing elementId.');
  if (!(file instanceof Blob)) return fail('Missing PNG file.');

  let selection: Record<string, string>;
  try {
    selection = JSON.parse(String(form.get('selection') ?? '{}'));
  } catch {
    return fail('selection must be JSON.');
  }

  try {
    const elements = saveLcExport(bookId, elementId, Buffer.from(await file.arrayBuffer()), selection);
    return Response.json({ elements });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
