// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getActiveAdmin: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/auth/admin", () => ({ getActiveAdmin: mocks.getActiveAdmin }));

import { authorizeAdminMutation } from "@/lib/admin/mutation-authorization";
import { assertAdminMutationOrigin } from "@/lib/admin/request-integrity";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.getActiveAdmin.mockResolvedValue({ role: "admin" });
});

describe("administrator mutation request integrity", () => {
  it("accepts the exact trusted origin", async () => {
    await expect(assertAdminMutationOrigin()).resolves.toBeUndefined();
  });

  it("rejects missing, malformed, cross-origin, and scheme-mismatched origins", async () => {
    for (const origin of [null, "not a url", "https://evil.example", "https://localhost:3000"]) {
      mocks.headers.mockResolvedValueOnce(
        new Headers(origin === null ? {} : { origin }),
      );
      await expect(assertAdminMutationOrigin()).rejects.toMatchObject({
        code: "invalid_origin",
      });
    }
  });

  it("checks origin before querying administrator membership", async () => {
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://evil.example" }));
    await expect(authorizeAdminMutation(["admin"])).rejects.toMatchObject({
      code: "invalid_origin",
    });
    expect(mocks.getActiveAdmin).not.toHaveBeenCalled();
  });

  it("maps absent membership to unauthorized without membership details", async () => {
    mocks.getActiveAdmin.mockResolvedValueOnce(null);
    await expect(authorizeAdminMutation(["admin"])).rejects.toMatchObject({
      code: "unauthorized",
    });
  });

  it("rejects insufficient roles after active membership lookup", async () => {
    mocks.getActiveAdmin.mockResolvedValueOnce({ role: "operations" });
    await expect(authorizeAdminMutation(["admin", "super_admin"])).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});
