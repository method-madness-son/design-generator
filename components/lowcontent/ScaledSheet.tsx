export function ScaledSheet({
  widthPx,
  heightPx,
  displayWidth,
  children,
}: {
  widthPx: number;
  heightPx: number;
  displayWidth: number;
  children: React.ReactNode;
}) {
  const scale = displayWidth / widthPx;
  return (
    <div style={{ width: Math.round(widthPx * scale), height: Math.round(heightPx * scale), overflow: 'hidden' }}>
      <div style={{ width: widthPx, height: heightPx, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}
