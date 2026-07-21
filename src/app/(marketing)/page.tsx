import { Container } from "@/components/ui/container";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <section className="relative h-[80vh] min-h-[600px] w-full bg-[var(--accent)] flex items-center justify-center">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Silver Oak Estate
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
            A premium, private farmhouse-based hospitality and event property located in Sector 135, Noida.
          </p>
        </Container>
      </section>

      <Container>
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">A Private Escape</h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-4">
              Experience our complete three-bedroom property featuring a private pool, 
              expansive lawn, spacious hall, and kitchen. Perfect for family stays, 
              small celebrations, and corporate experiences.
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ Six to eight overnight guests</li>
              <li>✓ Maximum thirty event guests</li>
              <li>✓ 11:00 AM Check-in | 10:00 AM Checkout</li>
            </ul>
          </div>
          <div className="bg-[var(--accent)] aspect-[4/3] rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)]">
            [Estate Image Placeholder]
          </div>
        </section>
      </Container>
    </div>
  );
}
