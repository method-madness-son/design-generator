import { planSlots } from "@/lib/mugLayout";
import { MUG_CANVASES } from "@/lib/mugSizes";
import type { MugGraphicType, MugSizeId, ResolvedMug } from "@/types/mug";

function GraphicMark({ type, color, size }: { type: MugGraphicType; color: string; size: number }) {
  if (size <= 0) return null;
  if (type === "cursor-block") {
    return (
      <svg width={size} height={Math.round(size * 0.38)} aria-hidden="true">
        <rect width={Math.round(size * 0.2)} height={Math.round(size * 0.38)} fill={color} />
      </svg>
    );
  }
  if (type === "tab-pips") {
    const gap = 8;
    const count = 5;
    const pip = Math.max(8, Math.round((size - gap * (count - 1)) / count));
    return (
      <svg width={size} height={Math.round(size * 0.28)} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <rect key={index} x={index * (pip + gap)} y={0} width={pip} height={Math.round(size * 0.28)} rx={6} fill={color} />
        ))}
      </svg>
    );
  }
  return (
    <svg width={Math.round(size * 0.7)} height={size} viewBox="0 0 70 100" aria-hidden="true">
      <path d="M16 92 C16 52 4 52 16 18" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M35 92 C35 48 22 48 35 12" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M54 92 C54 56 42 56 54 24" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function MugArtwork({ mug, size, capture = false }: { mug: ResolvedMug; size: MugSizeId; capture?: boolean }) {
  if (!mug.textInk || !mug.graphicInk || mug.errors.length > 0) return null;
  const canvas = MUG_CANVASES[size];
  const slots = planSlots({
    wrap: mug.wrap,
    size,
    lines: mug.lines,
    displayFont: mug.fonts.display,
    supportingFont: mug.fonts.supporting,
    hasGraphic: Boolean(mug.graphic),
  });
  const textColor = mug.textInk.hex;
  const graphicColor = mug.graphicInk.hex;

  return (
    <div
      id={capture ? "mug-art" : undefined}
      data-mug-art={capture ? "1" : undefined}
      data-mug-ready={capture ? "1" : undefined}
      style={{
        width: canvas.widthPx,
        height: canvas.heightPx,
        position: "relative",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {slots.map((slot, index) => (
        <div
          key={`${slot.x}-${index}`}
          data-mug-slot="1"
          style={{
            position: "absolute",
            left: slot.x,
            top: slot.y,
            width: slot.width,
            height: slot.height,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {mug.graphic ? <GraphicMark type={mug.graphic.type} color={graphicColor} size={slot.graphicPx} /> : null}
          {mug.lines.map((line, lineIndex) => (
            <div
              key={`${line.text}-${lineIndex}`}
              data-mug-line={line.font}
              style={{
                fontFamily: line.font === "display" ? mug.fonts.displayCss : mug.fonts.supportingCss,
                fontSize: line.font === "display" ? slot.displayPx : slot.supportingPx,
                lineHeight: line.font === "display" ? 0.92 : 1,
                color: textColor,
                whiteSpace: "nowrap",
                fontWeight: 400,
                marginTop: lineIndex === 0 ? 0 : 8,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
