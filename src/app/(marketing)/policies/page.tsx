import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Policies",
};

export default function PoliciesPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Policies</h1>
      
      <div className="prose prose-stone dark:prose-invert">
        <p className="text-lg font-medium text-[var(--warning)] p-4 border border-[var(--warning)] rounded-[var(--radius)] mb-8">
          Final booking and cancellation terms are being finalized and will be published before live paid bookings open.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Timings</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
            <li>Check-in: 11:00 AM</li>
            <li>Checkout: 10:00 AM</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Capacity</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
            <li>Overnight Guests: 6 - 8 maximum</li>
            <li>Event Guests: 30 maximum</li>
          </ul>
        </section>
      </div>
    </Container>
  );
}
