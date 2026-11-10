import fs from 'node:fs';
import path from 'node:path';
import { pngDimensions } from '@/lib/posterExports';
import { loadWrapDesign, wrapExportPath } from '@/lib/wrapDesigns';
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX } from '@/lib/wrapSizes';

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!loadWrapDesign(id)) return fail('No such wrapping paper design.', 404);
  const filePath = wrapExportPath(id);
  if (!fs.existsSync(filePath)) return fail('No export saved yet.', 404);
  const data = fs.readFileSync(filePath);
  return new Response(data, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!loadWrapDesign(id)) return fail('No such wrapping paper design.', 404);

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return fail('Missing PNG file.');

  const png = Buffer.from(await file.arrayBuffer());
  const dims = pngDimensions(png);
  if (!dims) return fail('Upload is not a PNG.');
  if (dims.width !== WRAP_TILE_WIDTH_PX || dims.height !== WRAP_TILE_HEIGHT_PX) {
    return fail(`Tile is ${dims.width}×${dims.height}; expected ${WRAP_TILE_WIDTH_PX}×${WRAP_TILE_HEIGHT_PX}.`);
  }

  const bg = (form.get('bg') as string | null)?.replace('#', '') ?? '';
  const fg = (form.get('fg') as string | null)?.replace('#', '') ?? '';
  const suffix = [bg, fg].filter(Boolean).join('-');
  const filename = suffix ? `${id}-${suffix}.png` : `${id}.png`;

  const output = path.join(path.dirname(wrapExportPath(id)), filename);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temp = `${output}.${process.pid}.tmp`;
  fs.writeFileSync(temp, png);
  fs.renameSync(temp, output);

  return Response.json({ ok: true, bytes: png.length, filename });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filePath = wrapExportPath(id);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return Response.json({ ok: true });
}
