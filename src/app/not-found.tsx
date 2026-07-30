import Link from "next/link";

const linkClassName =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)] px-5 font-soe-ui text-sm font-semibold text-[var(--soe-color-brand-strong)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2";

/**
 * Root not-found boundary. Next.js already marks this response noindex; this
 * adds the page landmark and recovery links that the default 404 screen lacks.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16 text-center"
    >
      <p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">
        Error 404
      </p>
      <h1 className="mt-4 font-soe-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight text-[var(--soe-color-brand-strong)]">
        This page could not be found
      </h1>
      <p className="mt-5 font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-color-ink-muted)]">
        The page you requested is unavailable or may have moved. Continue from
        the estate homepage, or check preferred dates and contact the estate
        team.
      </p>
      <nav
        aria-label="Recovery links"
        className="mt-9 flex flex-wrap justify-center gap-3"
      >
        <Link href="/" className={linkClassName}>
          Return home
        </Link>
        <Link href="/availability" className={linkClassName}>
          Check availability
        </Link>
        <Link href="/contact" className={linkClassName}>
          Contact the estate
        </Link>
      </nav>
    </main>
  );
}
