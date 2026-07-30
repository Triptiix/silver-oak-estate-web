/**
 * Visible, accessible status banner for legal pages that are still review
 * drafts. It states plainly that the content is not yet effective, so the page
 * is never presented as final legal authority. `lastReviewed` is the date this
 * placeholder was last touched, not an effective date.
 */
export function LegalDraftNotice({ lastReviewed }: { lastReviewed: string }) {
  return (
    <aside
      role="note"
      aria-label="Document status"
      className="mb-8 rounded-[var(--soe-radius-control)] border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em]">
        Review draft · Not yet effective
      </p>
      <p className="mt-2 text-sm leading-6">
        This page is a working draft under review and does not yet state final,
        legally effective terms. It is provided for transparency while the
        approved version is being prepared. Please contact the estate team for
        anything you need confirmed in writing before a booking.
      </p>
      <p className="mt-2 text-xs text-amber-900">
        Last reviewed:{" "}
        <time dateTime={lastReviewed}>{lastReviewed}</time>
      </p>
    </aside>
  );
}
