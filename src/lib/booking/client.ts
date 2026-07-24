import type { AvailabilityResponse, HoldRequest, HoldResponse, PublicBookingErrorCode } from "@/types/booking";

export class BookingApiError extends Error {
  code: PublicBookingErrorCode;
  constructor(message: string, code: PublicBookingErrorCode) {
    super(message);
    this.code = code;
  }
}

export async function fetchAvailability(month: string, abortSignal?: AbortSignal): Promise<AvailabilityResponse> {
  const response = await fetch(`/api/availability?month=${month}`, {
    cache: "no-store",
    signal: abortSignal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new BookingApiError(data.error?.message || "Failed to fetch availability", data.error?.code || "SERVER_ERROR");
  }

  return data as AvailabilityResponse;
}

export async function createHold(request: HoldRequest): Promise<HoldResponse> {
  const response = await fetch("/api/bookings/hold", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new BookingApiError(data.error?.message || "The hold could not be created.", data.error?.code || "SERVER_ERROR");
  }

  return data as HoldResponse;
}
