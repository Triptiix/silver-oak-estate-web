import type { NextConfig } from "next";

const SUPABASE_HOST_SUFFIX = ".supabase.co";

export function getSupabaseImageHostname(
  rawSupabaseUrl: string | undefined,
): string | null {
  if (!rawSupabaseUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawSupabaseUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const hasProjectSubdomain = hostname.length > SUPABASE_HOST_SUFFIX.length;

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      !hasProjectSubdomain ||
      !hostname.endsWith(SUPABASE_HOST_SUFFIX)
    ) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

export function createNextConfig(
  rawSupabaseUrl: string | undefined,
): NextConfig {
  const isDev = process.env.NODE_ENV === "development";
  const supabaseImageHostname = getSupabaseImageHostname(rawSupabaseUrl);
  const supabaseImageOrigin = supabaseImageHostname
    ? `https://${supabaseImageHostname}`
    : null;

  const cspDirectives = [
    "default-src 'self'",
    // Next.js development tooling may require unsafe-eval
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    ["img-src 'self' data:", supabaseImageOrigin].filter(Boolean).join(" "),
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://api.razorpay.com https://checkout.razorpay.com",
    "frame-src https://challenges.cloudflare.com https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return {
    images: {
      remotePatterns: supabaseImageHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseImageHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [],
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "Content-Security-Policy",
              value: cspDirectives.join("; "),
            },
          ],
        },
      ];
    },
  };
}

const nextConfig = createNextConfig(process.env.NEXT_PUBLIC_SUPABASE_URL);

export default nextConfig;
