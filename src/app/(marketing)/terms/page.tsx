import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";

// Placeholder legal content: not yet approved, so this route is noindex and is
// excluded from the sitemap until final content is provided (Phase 7D.3B/8).
export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms of service for Silver Oak Estate, the private farmhouse estate in Sector 135, Noida.",
  path: "/terms",
  noindex: true,
});

export default function TermsPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <LegalDraftNotice lastReviewed="2026-07-30" />
      <div className="prose prose-stone dark:prose-invert">
        <p>These terms are currently being finalized and will be updated before live paid bookings commence.</p>
      </div>
    </Container>
  );
}
