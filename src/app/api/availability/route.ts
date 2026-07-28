import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking/database";
import { monthSchema } from "@/lib/booking/schemas";
import { bookingError } from "@/lib/booking/api-errors";
import { getAvailabilityCapability } from "@/lib/capabilities/online-booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAvailabilityCapability().available) {
    return bookingError(
      503,
      "BOOKING_UNAVAILABLE",
      "Availability is currently unavailable. Contact our team for assistance.",
    );
  }

  const month = request.nextUrl.searchParams.get("month");
  const propertySlug = request.nextUrl.searchParams.get("property") ?? "silver-oak-estate";
  if (!monthSchema.safeParse(month).success || !/^[a-z0-9-]{1,80}$/.test(propertySlug)) {
    return bookingError(400, "INVALID_REQUEST", "A valid month is required.");
  }
  try {
    const data = await getAvailability(propertySlug, month!);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = typeof error === "object" && error && "message" in error ? String(error.message) : "";
    if (message.includes("property_not_found")) return bookingError(404, "PROPERTY_NOT_FOUND", "Property not found.");
    return bookingError(500, "SERVER_ERROR", "Availability could not be loaded.");
  }
}
