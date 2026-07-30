import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for Silver Oak Estate, the private farmhouse estate in Sector 135, Noida.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-stone dark:prose-invert">
        <p>Your privacy is important to us. This page will be updated with our full privacy policy before launch.</p>
      </div>
    </Container>
  );
}
