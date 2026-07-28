import { z } from "zod";
import {
  OVERNIGHT_GUEST_CAPACITY,
  STANDARD_DAY_EVENT_CAPACITY,
} from "@/config/public-information";
export { normalizePhone } from "@/lib/phone";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const businessDateSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-([012]\d|3[01])$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
});

export const holdRequestSchema = z.strictObject({
  requestId: z.string().uuid(),
  propertySlug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  checkInDate: businessDateSchema,
  customerName: z.string().trim().min(1).max(120),
  customerEmail: optionalTrimmed(254).pipe(z.string().email().optional()),
  customerPhone: z.string().trim().min(7).max(24),
  whatsapp: optionalTrimmed(24),
  guestCount: z.number().int().min(1).max(STANDARD_DAY_EVENT_CAPACITY),
  overnightGuestCount: z.number().int().min(0).max(OVERNIGHT_GUEST_CAPACITY).optional(),
  specialRequests: optionalTrimmed(1000),
  turnstileToken: z.string().min(1).max(4096),
}).refine((value) => (value.overnightGuestCount ?? 0) <= value.guestCount, {
  path: ["overnightGuestCount"], message: "Overnight guests cannot exceed total guests",
});
