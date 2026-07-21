import { Container } from "@/components/ui/container";
import { AvailabilityList } from "@/components/booking/availability-list";

export const metadata = {
  title: "Availability",
};

export default function AvailabilityPage() {
  return (
    <Container className="py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Availability</h1>
      <AvailabilityList />
    </Container>
  );
}
