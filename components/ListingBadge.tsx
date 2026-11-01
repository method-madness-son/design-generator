// Whether a poster is saved for listing (lib/posterExports.ts) and still needs Etsy copy.
export function ListingBadge({ sizes, hasEtsy }: { sizes: string[]; hasEtsy: boolean }) {
  if (sizes.length === 0) return <p className="text-xs text-neutral-400">Not saved for listing</p>;
  return (
    <p className="text-xs text-emerald-700">
      Eligible · {sizes.join(', ')}
      {!hasEtsy && <span className="text-amber-700"> · needs Etsy copy</span>}
    </p>
  );
}
