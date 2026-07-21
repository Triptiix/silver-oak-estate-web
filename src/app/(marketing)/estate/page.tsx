import { Container } from "@/components/ui/container";

export const metadata = {
  title: "The Estate",
  description: "Explore the complete three-bedroom property at Silver Oak Estate.",
};

export default function EstatePage() {
  return (
    <Container className="py-16">
      <h1 className="text-4xl font-bold mb-8">The Estate</h1>
      <p className="text-lg text-[var(--muted-foreground)] max-w-3xl mb-12">
        A premium private escape featuring three bedrooms, a pool, lawn, hall, and kitchen.
      </p>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-[var(--accent)] aspect-[4/3] rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)]">
          [Bedroom Image Placeholder]
        </div>
        <div className="bg-[var(--accent)] aspect-[4/3] rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)]">
          [Pool Image Placeholder]
        </div>
        <div className="bg-[var(--accent)] aspect-[4/3] rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)]">
          [Lawn Image Placeholder]
        </div>
      </div>
    </Container>
  );
}
