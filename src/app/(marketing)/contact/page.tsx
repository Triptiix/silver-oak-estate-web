import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <Container className="py-16 max-w-2xl text-center">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <p className="text-[var(--muted-foreground)] mb-8">
        We are located at Sector 135, Noida.
      </p>
      
      <div className="inline-block p-6 border border-[var(--border)] rounded-[var(--radius)]">
        <h2 className="font-bold mb-4">Get in Touch</h2>
        <Button className="w-full sm:w-auto">
          [WhatsApp CTA Placeholder]
        </Button>
      </div>
    </Container>
  );
}
