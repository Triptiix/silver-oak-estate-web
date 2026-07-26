"use client";

import { forwardRef } from "react";
import Link from "next/link";

export type AdminOperationFeedback = {
  kind: "success" | "replayed" | "warning" | "error";
  title: string;
  message: string;
  code?: string;
  details?: readonly string[];
  link?: { href: string; label: string };
};

export const AdminOperationResult = forwardRef<
  HTMLDivElement,
  {
    feedback: AdminOperationFeedback | null;
    onDismiss: () => void;
  }
>(({ feedback, onDismiss }, ref) => {
  if (!feedback) return null;

  const isFailure = feedback.kind === "error";
  const palette = feedback.kind === "warning"
    ? "border-amber-300 bg-amber-50 text-amber-950"
    : isFailure
      ? "border-red-300 bg-red-50 text-red-950"
      : "border-emerald-300 bg-emerald-50 text-emerald-950";

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={isFailure ? "alert" : undefined}
      aria-live={isFailure ? undefined : "polite"}
      className={`rounded border p-4 ${palette}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">{feedback.title}</h3>
          <p className="mt-1 text-sm">{feedback.message}</p>
          {feedback.details && (
            <ul className="mt-3 space-y-1 text-sm">
              {feedback.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          )}
          {feedback.link && (
            <Link
              href={feedback.link.href}
              className="mt-3 inline-block font-medium underline underline-offset-4"
            >
              {feedback.link.label}
            </Link>
          )}
          {feedback.code === "unauthorized" && (
            <Link
              href="/admin/login"
              className="mt-3 block font-medium underline underline-offset-4"
            >
              Return to administrator sign in
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-2 py-1 text-sm font-medium underline focus-visible:outline-none focus-visible:ring-2"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
});

AdminOperationResult.displayName = "AdminOperationResult";
