import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Book Your Stay",
};

export default function BookPage() {
  return (
    <Container className="py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Book Your Stay</h1>
      <p className="text-center text-[var(--muted-foreground)] mb-12">
        Select your dates to check availability at Silver Oak Estate.
      </p>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center">
        <p className="text-[var(--muted-foreground)] mb-4">
          [Booking Calendar Placeholder]
        </p>
        <p className="text-sm">
          Monday-Friday: INR 15,000 / night <br/>
          Saturday-Sunday: INR 20,000 / night
        </p>
      </div>
    </Container>
  );
}
