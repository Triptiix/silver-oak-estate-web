"use client";

/**
 * Shared presentation for a protected-route error boundary. The wording stays
 * route-specific through props; this component only guarantees the safe shape:
 * an announced alert, no private details, and a keyboard-safe retry control.
 */
export function AdminRouteError({
  title,
  description,
  reset,
}: {
  title: string;
  description: string;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto my-16 max-w-xl rounded border border-red-200 bg-red-50 p-6 text-red-900"
    >
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center rounded bg-red-900 px-4 text-sm font-semibold text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-900 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
