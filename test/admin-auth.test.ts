// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { getActiveAdmin, requireAdmin, requireAdminRole } from "@/lib/auth/admin";
import { logoutAction } from "@/app/admin/actions";
import { loginAction } from "@/app/admin/login/actions";

type Membership = {
  id: string;
  auth_user_id: string;
  role: "super_admin" | "admin" | "operations";
  name: string;
  email: string;
} | null;

function makeClient({
  userId = "auth-user-1",
  membership,
  signInError = null,
}: {
  userId?: string | null;
  membership: Membership;
  signInError?: Error | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: membership, error: null });
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle,
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: signInError }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue(builder),
  };
}

const activeOperations: NonNullable<Membership> = {
  id: "admin-row-1",
  auth_user_id: "auth-user-1",
  role: "operations",
  name: "Operations Admin",
  email: "operations@example.test",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("server-side administrator authorization", () => {
  it("allows an active administrator using database membership", async () => {
    const client = makeClient({ membership: activeOperations });
    createClientMock.mockResolvedValue(client);

    await expect(getActiveAdmin()).resolves.toMatchObject({
      authUserId: "auth-user-1",
      role: "operations",
    });
    expect(client.from).toHaveBeenCalledWith("admins");
    expect(client.from().select).toHaveBeenCalledWith(
      "id, auth_user_id, role, name, email",
    );
    expect(client.from().eq).toHaveBeenCalledWith("is_active", true);
  });

  it("denies an authenticated user without active membership", async () => {
    createClientMock.mockResolvedValue(makeClient({ membership: null }));

    await expect(requireAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login?error=unauthorized"
    );
  });

  it("enforces required roles on the server", async () => {
    createClientMock.mockResolvedValue(
      makeClient({ membership: activeOperations })
    );

    await expect(requireAdminRole("admin", "super_admin")).rejects.toThrow(
      "NEXT_REDIRECT:/admin/dashboard?error=forbidden"
    );
  });
});

describe("administrator session actions", () => {
  it("clears the Supabase session on logout", async () => {
    const client = makeClient({ membership: activeOperations });
    createClientMock.mockResolvedValue(client);

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(client.auth.signOut).toHaveBeenCalledOnce();
  });

  it("clears a valid Supabase session when membership is absent", async () => {
    const client = makeClient({ membership: null });
    createClientMock.mockResolvedValue(client);
    const formData = new FormData();
    formData.set("email", "person@example.test");
    formData.set("password", "not-logged-or-exposed");

    await expect(loginAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login?error=unauthorized"
    );
    expect(client.auth.signOut).toHaveBeenCalledOnce();
  });

  it("redirects an active administrator after a valid sign-in", async () => {
    const client = makeClient({ membership: activeOperations });
    createClientMock.mockResolvedValue(client);
    const formData = new FormData();
    formData.set("email", "operations@example.test");
    formData.set("password", "not-logged-or-exposed");

    await expect(loginAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/dashboard"
    );
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });
});
