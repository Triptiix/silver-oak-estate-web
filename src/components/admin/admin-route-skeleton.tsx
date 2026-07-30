/**
 * Shared loading placeholder for the administrator list routes. It carries no
 * record data — no amounts, booking references or recipients — only labelled
 * neutral blocks that hold the layout rhythm. It is understandable without
 * animation and honours reduced-motion (the pulse is disabled).
 */
export function AdminRouteSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <div
        aria-hidden="true"
        className="mt-4 space-y-4 motion-safe:animate-pulse"
      >
        <div className="h-28 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-40 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-40 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    </div>
  );
}
