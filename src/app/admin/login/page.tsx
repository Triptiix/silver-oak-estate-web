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
    <Container className="flex min-h-dvh items-center justify-center py-8 sm:py-12">
      <section
        aria-labelledby="admin-login-heading"
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          Silver Oak Estate
        </p>
        <h1 id="admin-login-heading" className="mt-3 text-2xl font-bold tracking-tight">
          Administrator sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Private, provisioned access for the estate operations workspace. No
          public administrator registration is available.
        </p>
        {errorMessage ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[var(--error)]"
          >
            {errorMessage}
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Administrator email
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
          <Button type="submit" className="min-h-11 w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-xs leading-5 text-[var(--muted-foreground)]">
          Access is limited to active administrator accounts provisioned by the
          estate team.
        </p>
      </section>
    </Container>
  );
}
