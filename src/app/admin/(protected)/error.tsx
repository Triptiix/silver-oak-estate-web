"use client";

export default function AdminOperationsError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto my-16 max-w-xl rounded border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="font-bold">Administrator data is temporarily unavailable</h2>
      <p className="mt-2 text-sm">The request failed safely and no internal details were returned.</p>
      <button onClick={reset} className="mt-4 rounded bg-red-900 px-4 py-2 text-sm font-semibold text-white">Try again</button>
    </div>
  );
}
