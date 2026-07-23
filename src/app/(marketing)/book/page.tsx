import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { BookingExperience } from "@/components/booking/booking-experience";

export const metadata = {
  title: "Book Your Stay - Silver Oak Estate",
};

export default function BookPage() {
  return (
    <Container className="py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4 text-slate-900 tracking-tight">Complete Your Reservation</h1>
      </div>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <p className="text-slate-500" aria-live="polite">Loading booking experience…</p>
        </div>
      }>
        <BookingExperience />
      </Suspense>
    </Container>
  );
}
