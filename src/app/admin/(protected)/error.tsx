"use client";

export default function AdminOperationsError({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto my-10 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 sm:my-16"
    >
      <h2 className="font-bold">Administrator data is temporarily unavailable</h2>
      <p className="mt-2 text-sm leading-6">
        The request failed safely and no internal details were returned.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 min-h-11 rounded bg-red-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-900 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
