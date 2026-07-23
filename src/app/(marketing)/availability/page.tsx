import { Container } from "@/components/ui/container";
import { AvailabilityFlow } from "@/components/booking/availability-flow";

export const metadata = {
  title: "Availability - Silver Oak Estate",
};

export default function AvailabilityPage() {
  return (
    <Container className="py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4 text-slate-900 tracking-tight">Reserve Your Stay</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Select an available date below to begin your booking. Silver Oak Estate is reserved as a complete 3 BHK property.
        </p>
      </div>
      <AvailabilityFlow />
    </Container>
  );
}
