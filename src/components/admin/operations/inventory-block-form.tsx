"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMaintenanceBlockAction,
  createOwnerBlockAction,
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
  type AdminUiRole,
} from "./form-helpers";
import { useAdminMutationIntent } from "./use-admin-mutation-intent";

const maintenanceReasons = [
  ["maintenance", "Maintenance"],
  ["repair", "Repair"],
  ["inspection", "Inspection"],
  ["deep_cleaning", "Deep cleaning"],
  ["safety", "Safety"],
  ["other", "Other"],
] as const;

const ownerReasons = [
  ["owner_use", "Owner use"],
  ["private_event", "Private event"],
  ["operational_hold", "Operational hold"],
  ["other", "Other"],
] as const;

export function InventoryBlockForm({ role }: { role: AdminUiRole }) {
  const canManageOwnerBlocks = role === "admin" || role === "super_admin";
  const [blockType, setBlockType] = useState<"owner_block" | "maintenance_block">(
    "maintenance_block",
  );
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { requestIdFor, clearCompletedIntent } = useAdminMutationIntent();
  const reasons = blockType === "owner_block" ? ownerReasons : maintenanceReasons;

  useEffect(() => {
    if (feedback) resultRef.current?.focus();
  }, [feedback]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const firstBlockedDate = String(form.get("firstBlockedDate") ?? "");
    const lastBlockedDate = String(form.get("lastBlockedDate") ?? "");
    const reason = String(form.get("reason") ?? "");
    const internalNote = String(form.get("internalNote") ?? "").trim();
    const errors: Record<string, string[]> = {};
    const first = Date.parse(`${firstBlockedDate}T00:00:00Z`);
    const last = Date.parse(`${lastBlockedDate}T00:00:00Z`);
    if (!firstBlockedDate) errors.firstBlockedDate = ["Select the first blocked date."];
    if (!lastBlockedDate) errors.lastBlockedDate = ["Select the last blocked date."];
    if (Number.isFinite(first) && Number.isFinite(last) && last < first) {
      errors.lastBlockedDate = ["Last blocked date cannot be before the first date."];
    } else if (Number.isFinite(first) && Number.isFinite(last) && (last - first) / 86_400_000 >= 31) {
      errors.lastBlockedDate = ["The date range cannot exceed the 31-night backend limit."];
    }
    if (!reason) errors.reason = ["Select a reason."];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        kind: "error",
        title: "Review the block details",
        message: "Correct the highlighted fields and try again.",
      });
      return;
    }

    const normalizedIntentKey = JSON.stringify({
      blockType,
      firstBlockedDate,
      lastBlockedDate,
      reason,
      internalNote,
    });
    const input = {
      firstBlockedDate,
      lastBlockedDate,
      reason,
      internalNote: internalNote || null,
      requestId: requestIdFor(normalizedIntentKey),
    };

    setPending(true);
    setFieldErrors({});
    setFeedback(null);
    try {
      const result = blockType === "owner_block"
        ? await createOwnerBlockAction({
            ...input,
            reason: reason as "owner_use" | "private_event" | "operational_hold" | "other",
          })
        : await createMaintenanceBlockAction({
            ...input,
            reason: reason as "maintenance" | "repair" | "inspection" | "deep_cleaning" | "safety" | "other",
          });
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFeedback(failureFeedback(result));
        return;
      }
      clearCompletedIntent();
      setFeedback({
        kind: result.data.applied ? "success" : "replayed",
        title: result.data.applied ? "Inventory block created" : "Completed operation replayed",
        message: result.data.applied
          ? "The server created the inventory block."
          : "The exact previously completed block operation was returned without creating another block.",
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
        message: "The result is unknown. Retry the unchanged operation to safely reuse its request ID.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Inventory workflow
      </p>
      <h2 className="mt-2 text-xl font-bold">Create an inventory block</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Block the complete property for a controlled reason. The server enforces
        a maximum 31-night range and the role boundary for each block type.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset
          disabled={pending}
          className="rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">Block type and role</legend>
          {canManageOwnerBlocks ? (
            <>
              <label htmlFor="blockType" className="mt-2 block text-sm font-medium">Block type</label>
              <select
                id="blockType"
                name="blockType"
                value={blockType}
                onChange={(event) => {
                  setBlockType(event.target.value as typeof blockType);
                  setFeedback(null);
                }}
                className={inputClassName}
              >
                <option value="maintenance_block">Maintenance block</option>
                <option value="owner_block">Owner block</option>
              </select>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Owner blocks are restricted to admin and super-admin. Maintenance
                blocks are available to every active administrator role.
              </p>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-medium">Maintenance block</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Your operations role cannot create owner blocks.
              </p>
            </div>
          )}
        </fieldset>

        <fieldset
          disabled={pending}
          className="rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">Blocked date range</legend>
          <p className="mb-3 text-xs leading-5 text-stone-500">
            Select inclusive blocked dates. The range may cover at most 31 nights.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstBlockedDate" className="text-sm font-medium">First blocked date</label>
            <input
              required
              disabled={pending}
              id="firstBlockedDate"
              name="firstBlockedDate"
              type="date"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "firstBlockedDate"))}
              aria-describedby="firstBlockedDate-help firstBlockedDate-error"
              className={inputClassName}
            />
            <p id="firstBlockedDate-help" className="mt-1 text-xs text-stone-500">Date format: YYYY-MM-DD.</p>
            {firstFieldError(fieldErrors, "firstBlockedDate") && <p id="firstBlockedDate-error" className={errorClassName}>{firstFieldError(fieldErrors, "firstBlockedDate")}</p>}
          </div>
          <div>
            <label htmlFor="lastBlockedDate" className="text-sm font-medium">Last blocked date</label>
            <input
              required
              disabled={pending}
              id="lastBlockedDate"
              name="lastBlockedDate"
              type="date"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "lastBlockedDate"))}
              aria-describedby="lastBlockedDate-help lastBlockedDate-error"
              className={inputClassName}
            />
            <p id="lastBlockedDate-help" className="mt-1 text-xs text-stone-500">Must be on or after the first date.</p>
            {firstFieldError(fieldErrors, "lastBlockedDate") && <p id="lastBlockedDate-error" className={errorClassName}>{firstFieldError(fieldErrors, "lastBlockedDate")}</p>}
          </div>
          </div>
        </fieldset>

        <fieldset
          disabled={pending}
          className="space-y-4 rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">Reason and internal note</legend>
          <div>
            <label htmlFor="blockReason" className="text-sm font-medium">Reason</label>
            <select
              required
              disabled={pending}
              id="blockReason"
              name="reason"
              defaultValue=""
              aria-invalid={Boolean(firstFieldError(fieldErrors, "reason"))}
              aria-describedby="blockReason-error"
              className={inputClassName}
            >
              <option value="" disabled>Select a reason</option>
              {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {firstFieldError(fieldErrors, "reason") && <p id="blockReason-error" className={errorClassName}>{firstFieldError(fieldErrors, "reason")}</p>}
          </div>

          <div>
            <label htmlFor="blockInternalNote" className="text-sm font-medium">Internal note (optional)</label>
            <textarea
              disabled={pending}
              id="blockInternalNote"
              name="internalNote"
              maxLength={500}
              rows={3}
              className={inputClassName}
            />
          </div>
        </fieldset>

        <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
          {pending ? "Creating block…" : "Create inventory block"}
        </Button>
      </form>
      <div className="mt-5">
        <AdminOperationResult
          ref={resultRef}
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      </div>
    </section>
  );
}
