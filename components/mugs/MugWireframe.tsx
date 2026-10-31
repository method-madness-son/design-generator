import { MugArtwork } from "@/components/mugs/MugArtwork";
import { planSlots, safeRect } from "@/lib/mugLayout";
import { MUG_CANVASES, MUG_HANDLE_GUTTER_IN, inchesToPx } from "@/lib/mugSizes";
import type { MugSizeId, ResolvedMug } from "@/types/mug";

function Handle({ side }: { side: "left" | "right" }) {
  const d = side === "right" ? "M6 16 C28 16 34 28 34 46 C34 64 28 76 6 76" : "M34 16 C12 16 6 28 6 46 C6 64 12 76 34 76";
  return (
    <svg width="36" height="92" viewBox="0 0 40 92" aria-hidden="true">
      <path d={d} fill="none" stroke="#171717" strokeWidth="3" />
    </svg>
  );
}

function MugFace({
  label,
  handle,
  start,
  end,
  mug,
  size,
}: {
  label: string;
  handle: "left" | "right";
  start: number;
  end: number;
  mug: ResolvedMug;
  size: MugSizeId;
}) {
  const canvas = MUG_CANVASES[size];
  const viewW = 220;
  const scale = viewW / (canvas.widthPx * (end - start));
  const viewH = Math.round(canvas.heightPx * scale);
  return (
    <figure className="m-0">
      <div className="flex items-center justify-center gap-1">
        {handle === "left" ? <Handle side="left" /> : <span className="inline-block w-9" />}
        <div>
          <svg width={viewW} height="16" aria-hidden="true">
            <ellipse cx={viewW / 2} cy="12" rx={viewW / 2 - 3} ry="5" fill="none" stroke="#171717" strokeWidth="2" />
          </svg>
          <div style={{ width: viewW, height: viewH, overflow: "hidden", borderLeft: "2px solid #171717", borderRight: "2px solid #171717", background: "#fff" }}>
            <div style={{ transform: `translateX(${-canvas.widthPx * start * scale}px) scale(${scale})`, transformOrigin: "top left" }}>
              <MugArtwork mug={mug} size={size} />
            </div>
          </div>
          <svg width={viewW} height="16" aria-hidden="true">
            <ellipse cx={viewW / 2} cy="4" rx={viewW / 2 - 3} ry="6" fill="#fff" stroke="#171717" strokeWidth="2" />
          </svg>
        </div>
        {handle === "right" ? <Handle side="right" /> : <span className="inline-block w-9" />}
      </div>
      <figcaption className="mt-1 text-center text-xs text-neutral-600">{label}</figcaption>
    </figure>
  );
}

function FlatWrap({ mug, size }: { mug: ResolvedMug; size: MugSizeId }) {
  const canvas = MUG_CANVASES[size];
  const scale = 980 / canvas.widthPx;
  const width = Math.round(canvas.widthPx * scale);
  const height = Math.round(canvas.heightPx * scale);
  const safe = safeRect(size);
  const gutter = inchesToPx(MUG_HANDLE_GUTTER_IN) * scale;
  const slots = planSlots({
    wrap: mug.wrap,
    size,
    lines: mug.lines,
    displayFont: mug.fonts.display,
    supportingFont: mug.fonts.supporting,
    hasGraphic: Boolean(mug.graphic),
  });
  return (
    <div>
      <div className="relative bg-white" style={{ width, height }}>
        <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MugArtwork mug={mug} size={size} />
        </div>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <rect x={1} y={1} width={width - 2} height={height - 2} fill="none" stroke="#171717" strokeWidth={2} />
          <rect x={safe.x * scale} y={safe.y * scale} width={safe.width * scale} height={safe.height * scale} fill="none" stroke="#c2410c" strokeWidth={1.5} strokeDasharray="6 4" />
          <rect x={0} y={0} width={gutter} height={height} fill="#171717" opacity={0.08} />
          <rect x={width - gutter} y={0} width={gutter} height={height} fill="#171717" opacity={0.08} />
          {slots.map((slot, index) => (
            <rect key={index} x={slot.x * scale} y={slot.y * scale} width={slot.width * scale} height={slot.height * scale} fill="none" stroke="#1d4ed8" strokeWidth={1} />
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        Solid line is the print area ({canvas.widthPx}×{canvas.heightPx} px). Dashed line is the safe zone. Shaded ends are the handle seam. Blue boxes are the type slots. One file, not a left panel and a right panel.
      </p>
    </div>
  );
}

export function MugWireframe({ mug, size, capture = false }: { mug: ResolvedMug; size: MugSizeId; capture?: boolean }) {
  const canvas = MUG_CANVASES[size];
  return (
    <div
      id={capture ? "mug-preview" : undefined}
      data-mug-preview={capture ? "1" : undefined}
      className="bg-white"
      style={capture ? { width: 1040, padding: 24 } : undefined}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <MugFace label="Front · opposite the handle" handle="right" start={0.3} end={0.7} mug={mug} size={size} />
        <MugFace label="Handle left" handle="left" start={0.06} end={0.46} mug={mug} size={size} />
        <MugFace label="Handle right" handle="right" start={0.54} end={0.94} mug={mug} size={size} />
      </div>
      <h3 className="mt-6 text-sm font-semibold text-neutral-800">
        Flat wrap · {canvas.label}
        {canvas.verified ? "" : " · UNVERIFIED"}
      </h3>
      <div className="mt-2 overflow-x-auto">
        <FlatWrap mug={mug} size={size} />
      </div>
    </div>
  );
}
