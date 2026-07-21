import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <Container className="py-16 text-center max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Pricing</h1>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-left">
        <h2 className="text-2xl font-bold mb-4">Standard Rates</h2>
        <ul className="space-y-4">
          <li className="flex justify-between border-b border-[var(--border)] pb-2">
            <span>Monday - Friday</span>
            <span className="font-medium">INR 15,000 / night</span>
          </li>
          <li className="flex justify-between border-b border-[var(--border)] pb-2">
            <span>Saturday - Sunday</span>
            <span className="font-medium">INR 20,000 / night</span>
          </li>
        </ul>
        <p className="text-sm text-[var(--muted-foreground)] mt-4">
          * A flat advance of INR 5,000 is required to confirm bookings.
        </p>
      </div>
    </Container>
  );
}
