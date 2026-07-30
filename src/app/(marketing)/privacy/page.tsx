import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";

// Placeholder legal content: not yet approved, so this route is noindex and is
// excluded from the sitemap until final content is provided (Phase 7D.3B/8).
export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for Silver Oak Estate, the private farmhouse estate in Sector 135, Noida.",
  path: "/privacy",
  noindex: true,
});

export default function PrivacyPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <LegalDraftNotice lastReviewed="2026-07-30" />
      <div className="prose prose-stone dark:prose-invert">
        <p>Your privacy is important to us. This page will be updated with our full privacy policy before launch.</p>
      </div>
    </Container>
  );
}
