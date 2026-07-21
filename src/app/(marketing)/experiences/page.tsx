import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Experiences",
};

export default function ExperiencesPage() {
  return (
    <Container className="py-16">
      <h1 className="text-4xl font-bold mb-8">Experiences</h1>
      <p className="text-[var(--muted-foreground)] max-w-2xl mb-8">
        Discover what makes a stay at Silver Oak Estate unique. Perfect for family 
        stays, small celebrations, and corporate experiences.
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 border border-[var(--border)] rounded-[var(--radius)]">
          <h2 className="text-xl font-bold mb-4">Family Getaways</h2>
          <p className="text-[var(--muted-foreground)]">A private and secure environment for families to relax and reconnect.</p>
        </div>
        <div className="p-6 border border-[var(--border)] rounded-[var(--radius)]">
          <h2 className="text-xl font-bold mb-4">Corporate Retreats</h2>
          <p className="text-[var(--muted-foreground)]">An ideal setting for team building and focused corporate offsites.</p>
        </div>
      </div>
    </Container>
  );
}
