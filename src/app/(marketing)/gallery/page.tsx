import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Gallery",
};

export default function GalleryPage() {
  return (
    <Container className="py-16">
      <h1 className="text-4xl font-bold mb-8">Gallery</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[var(--accent)] aspect-square rounded-[var(--radius)] flex items-center justify-center text-[var(--muted-foreground)] text-sm">
            [Gallery Image Placeholder {i}]
          </div>
        ))}
      </div>
    </Container>
  );
}
