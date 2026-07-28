// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { getAvailability } = vi.hoisted(() => ({ getAvailability: vi.fn() }));
vi.mock("@/lib/booking/database", () => ({ getAvailability }));
import { NextRequest } from "next/server";
import { GET } from "@/app/api/availability/route";

const safe = { propertySlug: "silver-oak-estate", month: "2026-07", timezone: "Asia/Kolkata", checkInTime: "11:00", checkOutTime: "10:00", generatedAt: "2026-07-01T00:00:00Z", dates: [{ date: "2026-07-25", available: true, priceAmountPaise: 2000000, advanceAmountPaise: 500000 }] };
describe("availability API", () => {
  beforeEach(() => {
    process.env.ONLINE_BOOKING_ENABLED = "true";
    getAvailability.mockReset();
  });
  it("returns a valid safe month response with no-store", async () => { getAvailability.mockResolvedValue(safe); const response = await GET(new NextRequest("http://localhost/api/availability?month=2026-07")); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store, max-age=0"); expect(await response.json()).toEqual(safe); });
  it("fails closed before database work when online booking is disabled", async () => {
    process.env.ONLINE_BOOKING_ENABLED = "false";
    const response = await GET(new NextRequest("http://localhost/api/availability?month=2026-07"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "BOOKING_UNAVAILABLE",
        message: "Online booking is currently unavailable. Contact our team for assistance.",
      },
    });
    expect(getAvailability).not.toHaveBeenCalled();
  });
  it("rejects an invalid month", async () => expect((await GET(new NextRequest("http://localhost/api/availability?month=July"))).status).toBe(400));
  it("returns 404 for inactive or unknown property", async () => { getAvailability.mockImplementationOnce(async () => { throw new Error("property_not_found"); }); const response = await GET(new NextRequest("http://localhost/api/availability?month=2026-07&property=missing")); expect(response.status).toBe(404); });
  it("does not leak internal database errors", async () => { getAvailability.mockImplementationOnce(async () => { throw new Error("secret database detail"); }); const body = await (await GET(new NextRequest("http://localhost/api/availability?month=2026-07"))).json(); expect(JSON.stringify(body)).not.toContain("secret database detail"); });
});
