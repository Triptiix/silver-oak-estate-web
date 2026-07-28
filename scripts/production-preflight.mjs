const PROFILE_FIELDS = {
  core: [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "APP_ENV",
    "APP_TIMEZONE",
  ],
  "booking-test": [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "APP_ENV",
    "APP_TIMEZONE",
    "ONLINE_BOOKING_ENABLED",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "PAYMENT_PROVIDER",
    "PAYMENT_MODE",
    "BOOKING_HOLD_MINUTES",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RAZORPAY_KEY_SECRET",
    "PAYMENT_WEBHOOK_SECRET",
    "TURNSTILE_SECRET_KEY",
    "BOOKING_TOKEN_SECRET",
  ],
  email: [
    "EMAIL_API_KEY",
    "EMAIL_SENDER",
    "ADMIN_NOTIFICATION_RECIPIENTS",
  ],
  "production-live": [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "APP_ENV",
    "APP_TIMEZONE",
    "ONLINE_BOOKING_ENABLED",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "PAYMENT_PROVIDER",
    "PAYMENT_MODE",
    "BOOKING_HOLD_MINUTES",
    "MANUAL_PAYMENT_HOLD_MINUTES",
    "DATABASE_CRON_ENABLED",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RAZORPAY_KEY_SECRET",
    "PAYMENT_WEBHOOK_SECRET",
    "TURNSTILE_SECRET_KEY",
    "BOOKING_TOKEN_SECRET",
    "ICAL_FEED_SECRET",
    "EMAIL_API_KEY",
    "EMAIL_SENDER",
    "ADMIN_NOTIFICATION_RECIPIENTS",
    "CRON_SECRET",
    "ERROR_MONITORING_DSN",
  ],
};

const SECRET_FIELDS = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_SECRET",
  "PAYMENT_WEBHOOK_SECRET",
  "TURNSTILE_SECRET_KEY",
  "BOOKING_TOKEN_SECRET",
  "ICAL_FEED_SECRET",
  "EMAIL_API_KEY",
  "CRON_SECRET",
]);

const PLACEHOLDER_PATTERNS = [
  /^<.*>$/,
  /placeholder/i,
  /your[_ -]/i,
  /example\.supabase\.co/i,
  /example\.invalid/i,
  /^ci-/i,
  /rzp_(?:test|live)_<.*>/i,
];

const PROFILE_ALIASES = {
  staging: "booking-test",
  production: "production-live",
};

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function looksLikePlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function addFinding(collection, field, message) {
  collection.push({ field, message });
}

function validateHttpsUrl(environment, field, blockers, options = {}) {
  const value = environment[field];
  if (isBlank(value)) return;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      addFinding(blockers, field, "must use HTTPS");
    }
    if (options.forbidLocalhost && ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      addFinding(blockers, field, "must not use a local host");
    }
  } catch {
    addFinding(blockers, field, "must be a valid URL");
  }
}

function validatePositiveInteger(environment, field, blockers) {
  const value = environment[field];
  if (isBlank(value)) return;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    addFinding(blockers, field, "must be a positive integer");
  }
}

function validateEmailList(environment, field, blockers) {
  const value = environment[field];
  if (isBlank(value)) return;

  const recipients = value.split(",").map((item) => item.trim()).filter(Boolean);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (recipients.length === 0 || recipients.some((item) => !emailPattern.test(item))) {
    addFinding(blockers, field, "must contain one or more comma-separated email addresses");
  }
}

function validateEmailAddress(environment, field, blockers) {
  const value = environment[field];
  if (isBlank(value)) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    addFinding(blockers, field, "must be a valid provider-verified email address");
  }
}

function resolveProfile(options) {
  if (options.profile) {
    if (!(options.profile in PROFILE_FIELDS)) {
      throw new Error(`Unsupported preflight profile: ${options.profile}`);
    }
    return options.profile;
  }

  if (options.target) {
    const aliasedProfile = PROFILE_ALIASES[options.target];
    if (!aliasedProfile) {
      throw new Error(`Unsupported preflight target: ${options.target}`);
    }
    return aliasedProfile;
  }

  return "core";
}

export function evaluateProductionReadiness(environment, options = {}) {
  const profile = resolveProfile(options);
  const requiredFields = PROFILE_FIELDS[profile];
  const blockers = [];
  const warnings = [];

  for (const field of requiredFields) {
    const value = environment[field];
    if (isBlank(value)) {
      addFinding(blockers, field, "is required");
      continue;
    }
    if (looksLikePlaceholder(value)) {
      addFinding(blockers, field, "still contains a placeholder value");
    }
  }

  for (const field of requiredFields) {
    const value = environment[field];
    if (SECRET_FIELDS.has(field) && !isBlank(value) && value.trim().length < 16) {
      addFinding(blockers, field, "is too short for a deployment secret");
    }
  }

  if (profile === "core" || profile === "booking-test" || profile === "production-live") {
    validateHttpsUrl(environment, "NEXT_PUBLIC_SITE_URL", blockers, { forbidLocalhost: true });
    validateHttpsUrl(environment, "NEXT_PUBLIC_SUPABASE_URL", blockers, { forbidLocalhost: true });

    if (!new Set(["development", "staging", "production"]).has(environment.APP_ENV)) {
      addFinding(blockers, "APP_ENV", "must equal development, staging or production");
    }
    if (environment.APP_TIMEZONE !== "Asia/Kolkata") {
      addFinding(blockers, "APP_TIMEZONE", "must equal Asia/Kolkata");
    }
  }

  if (profile === "booking-test" || profile === "production-live") {
    validatePositiveInteger(environment, "BOOKING_HOLD_MINUTES", blockers);

    if (environment.ONLINE_BOOKING_ENABLED !== "true") {
      addFinding(blockers, "ONLINE_BOOKING_ENABLED", "must equal true for an enabled booking flow");
    }
    if (environment.PAYMENT_PROVIDER !== "razorpay") {
      addFinding(blockers, "PAYMENT_PROVIDER", "must equal razorpay");
    }
  }

  if (profile === "booking-test") {
    if (environment.APP_ENV !== "staging") {
      addFinding(blockers, "APP_ENV", "must equal staging for the booking rehearsal");
    }
    if (environment.PAYMENT_MODE !== "test") {
      addFinding(blockers, "PAYMENT_MODE", "must equal test for the booking rehearsal");
    }
    if (
      typeof environment.NEXT_PUBLIC_RAZORPAY_KEY_ID === "string" &&
      !environment.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_test_")
    ) {
      addFinding(blockers, "NEXT_PUBLIC_RAZORPAY_KEY_ID", "must use a Razorpay test key ID");
    }
  }

  if (profile === "email" || profile === "production-live") {
    validateEmailAddress(environment, "EMAIL_SENDER", blockers);
    validateEmailList(environment, "ADMIN_NOTIFICATION_RECIPIENTS", blockers);
  }

  if (profile === "production-live") {
    validatePositiveInteger(environment, "MANUAL_PAYMENT_HOLD_MINUTES", blockers);
    validateHttpsUrl(environment, "ERROR_MONITORING_DSN", blockers);

    if (environment.APP_ENV !== "production") {
      addFinding(blockers, "APP_ENV", "must equal production");
    }
    if (environment.NEXT_PUBLIC_SITE_URL !== "https://silveroakestate.online") {
      addFinding(blockers, "NEXT_PUBLIC_SITE_URL", "must equal the canonical production URL");
    }
    if (environment.PAYMENT_MODE !== "live") {
      addFinding(blockers, "PAYMENT_MODE", "must equal live for the production launch gate");
    }
    if (
      typeof environment.NEXT_PUBLIC_RAZORPAY_KEY_ID === "string" &&
      !environment.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_live_")
    ) {
      addFinding(blockers, "NEXT_PUBLIC_RAZORPAY_KEY_ID", "must use a Razorpay live key ID");
    }
    if (!new Set(["true", "false"]).has(environment.DATABASE_CRON_ENABLED)) {
      addFinding(blockers, "DATABASE_CRON_ENABLED", "must equal true or false");
    }
  }

  if (
    (profile === "core" || profile === "booking-test") &&
    isBlank(environment.ERROR_MONITORING_DSN)
  ) {
    addFinding(warnings, "ERROR_MONITORING_DSN", "is not configured; deployment observability will be limited");
  }

  if (profile !== "email" && environment.VERCEL !== "1") {
    addFinding(warnings, "VERCEL", "is not present; run the final check inside the intended Vercel environment");
  }

  return {
    profile,
    ready: blockers.length === 0,
    blockers,
    warnings,
    checkedFields: requiredFields.length,
  };
}

export function formatProductionReadinessReport(result) {
  const lines = [
    `Readiness profile: ${result.profile}`,
    `Status: ${result.ready ? "PASS" : "BLOCKED"}`,
    `Required fields checked: ${result.checkedFields}`,
  ];

  if (result.blockers.length > 0) {
    lines.push("Blockers:");
    for (const finding of result.blockers) {
      lines.push(`- ${finding.field}: ${finding.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    for (const finding of result.warnings) {
      lines.push(`- ${finding.field}: ${finding.message}`);
    }
  }

  lines.push("Secret values were not printed.");
  return lines.join("\n");
}

function parseOptions(argumentsList) {
  const profileArgument = argumentsList.find((item) => item.startsWith("--profile="));
  const targetArgument = argumentsList.find((item) => item.startsWith("--target="));

  return {
    profile: profileArgument?.slice("--profile=".length),
    target: targetArgument?.slice("--target=".length),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = evaluateProductionReadiness(
      process.env,
      parseOptions(process.argv.slice(2)),
    );
    console.log(formatProductionReadinessReport(result));
    process.exitCode = result.ready ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production preflight failed");
    process.exitCode = 1;
  }
}
