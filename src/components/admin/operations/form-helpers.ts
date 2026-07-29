import type { AdminOperationFeedback } from "./admin-operation-result";

export type AdminUiRole = "operations" | "admin" | "super_admin";

export type SafeActionFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export function failureFeedback(failure: SafeActionFailure): AdminOperationFeedback {
  return {
    kind: "error",
    title: failure.error.code === "forbidden"
      ? "Permission denied"
      : failure.error.code === "unauthorized"
        ? "Sign-in required"
        : "Operation not completed",
    message: failure.error.message,
    code: failure.error.code,
  };
}

export function firstFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export const inputClassName =
  "mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-stone-100";

export const errorClassName = "mt-1 text-sm leading-5 text-red-700";
