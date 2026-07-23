import { Container } from "@/components/ui/container";
import { BookingForm } from "@/components/booking/booking-form";

export const metadata = {
  title: "Book Your Stay",
};

export default function BookPage() {
  return (
    <Container className="py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Book Your Stay</h1>
      <p className="text-center text-[var(--muted-foreground)] mb-12">
        Create a temporary ten-minute hold. Payment is not enabled and a hold is not a confirmed booking.
      </p>
      <BookingForm />
    </Container>
  );
}
