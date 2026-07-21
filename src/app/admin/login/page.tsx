import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";

export const metadata = {
  title: "Admin Login",
};

const errorMessages: Record<string, string> = {
  invalid_credentials: "Unable to sign in with those credentials.",
  unauthorized: "This account does not have active administrator access.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <Container className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          Sign in with an administrator account provisioned by the estate team.
        </p>
        {errorMessage ? (
          <p role="alert" className="mb-4 text-sm text-[var(--error)]">
            {errorMessage}
          </p>
        ) : null}
        <form action={loginAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </Container>
  );
}
