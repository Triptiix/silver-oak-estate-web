import { Container } from "@/components/ui/container";
import { AvailabilityFlow } from "@/components/booking/availability-flow";
import { BookingUnavailable } from "@/components/booking/booking-unavailable";
import {
  getAvailabilityCapability,
  getOnlineBookingCapability,
} from "@/lib/capabilities/online-booking";

export const metadata = {
  title: "Availability - Silver Oak Estate",
};

export default function AvailabilityPage() {
  const availability = getAvailabilityCapability();
  const onlineBooking = getOnlineBookingCapability();

  return (
    <Container className="py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4 text-slate-900 tracking-tight">Reserve Your Stay</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Silver Oak Estate is reserved as a complete 3 BHK property.
          {availability.available
            ? onlineBooking.available
              ? " Select an available date below to begin your booking."
              : " View available dates below, then contact our team to reserve your preferred date."
            : " Contact our team for current availability and assisted booking."}
        </p>
      </div>
      {availability.available ? (
        <AvailabilityFlow onlineBookingAvailable={onlineBooking.available} />
      ) : (
        <BookingUnavailable />
      )}
    </Container>
  );
}
