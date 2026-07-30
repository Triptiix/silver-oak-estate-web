import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Terms of Service",
  alternates: {
    canonical: "/terms",
  },
};

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
