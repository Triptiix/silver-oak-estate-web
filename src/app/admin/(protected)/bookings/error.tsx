"use client";

export default function BookingOperationsError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto my-16 max-w-xl rounded border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="font-bold">Booking operations are temporarily unavailable</h2>
      <p className="mt-2 text-sm">No booking or customer details were exposed. Try the protected request again.</p>
      <button onClick={reset} className="mt-4 rounded bg-red-900 px-4 py-2 text-sm font-semibold text-white">Try again</button>
    </div>
  );
}
