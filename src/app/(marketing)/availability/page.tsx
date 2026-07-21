import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Availability",
};

export default function AvailabilityPage() {
  return (
    <Container className="py-16 text-center max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Availability</h1>
      <p className="text-[var(--muted-foreground)]">
        Live availability will be enabled in the booking implementation phase. Please contact us directly for current availability.
      </p>
    </Container>
  );
}
