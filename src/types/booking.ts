export type AvailabilityDateEntry = {
  date: string;
  available: boolean;
  priceAmountPaise: number;
  advanceAmountPaise: number;
};

export type AvailabilityResponse = {
  propertySlug: string;
  month: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  generatedAt: string;
  dates: AvailabilityDateEntry[];
};

export type HoldRequest = {
  requestId: string;
  propertySlug: string;
  checkInDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  whatsapp?: string;
  guestCount: number;
  overnightGuestCount?: number;
  specialRequests?: string;
  turnstileToken: string;
};

export type HoldResponse = {
  bookingReference: string;
  checkInAt: string;
  checkOutAt: string;
  holdExpiresAt: string;
  priceAmountPaise: number;
  advanceAmountPaise: number;
  balanceAmountPaise: number;
  currency: string;
};

export type PublicBookingErrorCode =
  | "INVALID_REQUEST"
  | "ORIGIN_REJECTED"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "BOT_VERIFICATION_FAILED"
  | "PROPERTY_NOT_FOUND"
  | "DATE_UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "HOLD_LIMIT_REACHED"
  | "INVALID_HOLD"
  | "PAYMENT_UNAVAILABLE"
  | "PAYMENT_VERIFICATION_FAILED"
  | "PAYMENT_RECOVERY_REQUIRED"
  | "SERVER_ERROR";
