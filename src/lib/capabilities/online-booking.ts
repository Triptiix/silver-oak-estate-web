import "server-only";

export const AVAILABILITY_REQUIRED_FIELDS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const ONLINE_BOOKING_REQUIRED_FIELDS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "BOOKING_TOKEN_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "PAYMENT_WEBHOOK_SECRET",
] as const;

type AvailabilityField = (typeof AVAILABILITY_REQUIRED_FIELDS)[number];
type OnlineBookingField = (typeof ONLINE_BOOKING_REQUIRED_FIELDS)[number];

export type AvailabilityCapability = {
  available: boolean;
  state: "incomplete" | "ready";
  missingFields: AvailabilityField[];
};

export type OnlineBookingCapability = {
  available: boolean;
  state: "disabled" | "incomplete" | "ready";
  missingFields: OnlineBookingField[];
};

const PLACEHOLDER_PATTERNS = [
  /^<.*>$/,
  /placeholder/i,
  /your[_ -]/i,
  /example\.supabase\.co/i,
  /example\.invalid/i,
];

function hasUsableValue(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

export function evaluateAvailabilityCapability(
  environment: Record<string, string | undefined>,
): AvailabilityCapability {
  const missingFields = AVAILABILITY_REQUIRED_FIELDS.filter(
    (field) => !hasUsableValue(environment[field]),
  );

  if (missingFields.length > 0) {
    return {
      available: false,
      state: "incomplete",
      missingFields,
    };
  }

  return {
    available: true,
    state: "ready",
    missingFields: [],
  };
}

export function evaluateOnlineBookingCapability(
  environment: Record<string, string | undefined>,
): OnlineBookingCapability {
  if (environment.ONLINE_BOOKING_ENABLED !== "true") {
    return {
      available: false,
      state: "disabled",
      missingFields: [],
    };
  }

  const missingFields = ONLINE_BOOKING_REQUIRED_FIELDS.filter(
    (field) => !hasUsableValue(environment[field]),
  );

  if (missingFields.length > 0) {
    return {
      available: false,
      state: "incomplete",
      missingFields,
    };
  }

  return {
    available: true,
    state: "ready",
    missingFields: [],
  };
}

export function getAvailabilityCapability(): AvailabilityCapability {
  return evaluateAvailabilityCapability(process.env);
}

export function getOnlineBookingCapability(): OnlineBookingCapability {
  return evaluateOnlineBookingCapability(process.env);
}
