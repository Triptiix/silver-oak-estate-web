"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  releaseMaintenanceBlockAction,
  releaseOwnerBlockAction,
} from "@/app/admin/(protected)/actions/inventory";
import { Button } from "@/components/ui/button";
import {
  AdminOperationResult,
  type AdminOperationFeedback,
} from "./admin-operation-result";
import {
  errorClassName,
  failureFeedback,
  firstFieldError,
  inputClassName,
} from "./form-helpers";
import { useAdminMutationIntent } from "./use-admin-mutation-intent";

type ReleasableBlock = {
  reservationId: string;
  reservationType: "owner_block" | "maintenance_block";
  startAt: string;
  endAt: string;
};

const releaseReasons = [
  ["no_longer_needed", "No longer needed"],
  ["corrected", "Corrected"],
  ["rescheduled", "Rescheduled"],
  ["created_in_error", "Created in error"],
  ["other", "Other"],
] as const;

export function ReleaseInventoryBlockForm({
  block,
  onOperationFeedback,
}: {
  block: ReleasableBlock;
  onOperationFeedback: (feedback: AdminOperationFeedback | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const fieldId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { requestIdFor, clearCompletedIntent } = useAdminMutationIntent();

  useEffect(() => {
    if (feedback) resultRef.current?.focus();
  }, [feedback]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "");
    const internalNote = String(form.get("internalNote") ?? "").trim();
    const confirmed = form.get("confirmed") === "on";
    const errors: Record<string, string[]> = {};
    if (!reason) errors.reason = ["Select a release reason."];
    if (!confirmed) errors.confirmed = ["Confirm that this active block should be released."];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        kind: "error",
        title: "Release not confirmed",
        message: "Review the highlighted fields and try again.",
      });
      return;
    }

    const requestId = requestIdFor(JSON.stringify({
      reservationId: block.reservationId,
      reservationType: block.reservationType,
      reason,
      internalNote,
    }));
    const input = {
      reservationId: block.reservationId,
      requestId,
      reason: reason as "no_longer_needed" | "corrected" | "rescheduled" | "created_in_error" | "other",
      internalNote: internalNote || null,
    };

    setPending(true);
    setFieldErrors({});
    setFeedback(null);
    onOperationFeedback(null);
    try {
      const result = block.reservationType === "owner_block"
        ? await releaseOwnerBlockAction(input)
        : await releaseMaintenanceBlockAction(input);
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        const failure = failureFeedback(result);
        if (["block_not_found", "block_not_active", "wrong_block_type"].includes(result.error.code)) {
          onOperationFeedback(failure);
          router.refresh();
        } else {
          setFeedback(failure);
        }
        return;
      }
      clearCompletedIntent();
      onOperationFeedback({
        kind: result.data.applied ? "success" : "replayed",
        title: result.data.applied ? "Inventory block released" : "Completed release replayed",
        message: result.data.applied
          ? "The server released the active inventory block."
          : "The exact previously completed release was returned without a second mutation.",
        details: [
          `Type: ${result.data.reservationType.replaceAll("_", " ")}`,
          `Dates: ${result.data.firstBlockedDate} to ${result.data.lastBlockedDate}`,
        ],
      });
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        title: "Connection interrupted",
        message: "The result is unknown. Retry the unchanged release to safely reuse its request ID.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="mt-3 rounded border border-stone-200 p-3">
      <summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2">
        Release this {block.reservationType.replaceAll("_", " ")}
      </summary>
      <p className="mt-3 text-sm text-stone-600">
        You are releasing {block.reservationType.replaceAll("_", " ")} inventory from{" "}
        <time>{new Date(block.startAt).toLocaleDateString("en-IN")}</time> to{" "}
        <time>{new Date(block.endAt).toLocaleDateString("en-IN")}</time>.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${fieldId}-reason`} className="text-sm font-medium">Release reason</label>
          <select
            required
            disabled={pending}
            id={`${fieldId}-reason`}
            name="reason"
            defaultValue=""
            aria-invalid={Boolean(firstFieldError(fieldErrors, "reason"))}
            aria-describedby={`${fieldId}-reason-error`}
            className={inputClassName}
          >
            <option value="" disabled>Select a reason</option>
            {releaseReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {firstFieldError(fieldErrors, "reason") && <p id={`${fieldId}-reason-error`} className={errorClassName}>{firstFieldError(fieldErrors, "reason")}</p>}
        </div>
        <div>
          <label htmlFor={`${fieldId}-note`} className="text-sm font-medium">Internal note (optional)</label>
          <textarea
            disabled={pending}
            id={`${fieldId}-note`}
            name="internalNote"
            maxLength={500}
            rows={2}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              disabled={pending}
              type="checkbox"
              name="confirmed"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "confirmed"))}
              aria-describedby={`${fieldId}-confirm-error`}
              className="mt-1 h-4 w-4"
            />
            <span>I confirm that this active block should be released.</span>
          </label>
          {firstFieldError(fieldErrors, "confirmed") && <p id={`${fieldId}-confirm-error`} className={errorClassName}>{firstFieldError(fieldErrors, "confirmed")}</p>}
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Releasing block…" : "Release inventory block"}
        </Button>
      </form>
      <div className="mt-4">
        <AdminOperationResult
          ref={resultRef}
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      </div>
    </details>
  );
}
