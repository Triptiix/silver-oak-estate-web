import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Location",
};

export default function LocationPage() {
  return (
    <Container className="py-16 text-center max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Location</h1>
      <p className="text-[var(--muted-foreground)] mb-8">
        We are located in Sector 135, Noida. Detailed directions will be provided upon booking confirmation.
      </p>
      <div className="bg-[var(--accent)] aspect-[16/9] rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)]">
        [Map Placeholder]
      </div>
    </Container>
  );
}
