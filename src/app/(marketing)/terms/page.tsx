import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms of service for Silver Oak Estate, the private farmhouse estate in Sector 135, Noida.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-stone dark:prose-invert">
        <p>These terms are currently being finalized and will be updated before live paid bookings commence.</p>
      </div>
    </Container>
  );
}
