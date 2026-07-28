// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  publicRpc: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/supabase/public", () => ({
  createPublicSupabaseClient: () => ({ rpc: mocks.publicRpc }),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

import { getAvailability } from "@/lib/booking/database";

const response = {
  propertySlug: "silver-oak-estate",
  month: "2026-08",
  timezone: "Asia/Kolkata",
  checkInTime: "11:00",
  checkOutTime: "10:00",
  generatedAt: "2026-07-28T00:00:00Z",
  dates: [],
};

describe("public availability database client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publicRpc.mockResolvedValue({ data: response, error: null });
  });

  it("uses the anon public client and never creates a service-role client", async () => {
    await expect(getAvailability("silver-oak-estate", "2026-08")).resolves.toEqual(response);

    expect(mocks.publicRpc).toHaveBeenCalledWith("get_monthly_availability", {
      p_property_slug: "silver-oak-estate",
      p_month: "2026-08",
    });
    expect(mocks.createServiceRoleClient).not.toHaveBeenCalled();
  });

  it("propagates bounded Supabase RPC failures", async () => {
    const error = new Error("permission denied");
    mocks.publicRpc.mockResolvedValue({ data: null, error });

    await expect(getAvailability("silver-oak-estate", "2026-08")).rejects.toBe(error);
  });
});
