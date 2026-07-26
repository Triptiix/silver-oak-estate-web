"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyManualPaymentAction } from "@/app/admin/(protected)/actions/manual-payments";
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
import { parseRupeesToPaise } from "./money";
import { useAdminMutationIntent } from "./use-admin-mutation-intent";

export type ManualPaymentCandidate = {
  bookingReference: string;
  provider: "manual_upi" | "payment_link";
  paymentStatus: "pending" | "expired";
  expectedAmountPaise: number;
  currency: string;
};

function formatExpectedAmount(candidate: ManualPaymentCandidate) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: candidate.currency,
  }).format(candidate.expectedAmountPaise / 100);
}

export function ManualPaymentVerificationForm({
  candidate,
  onOperationFeedback,
}: {
  candidate: ManualPaymentCandidate;
  onOperationFeedback?: (feedback: AdminOperationFeedback | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
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
    const externalReference = String(form.get("externalReference") ?? "").trim().toUpperCase();
    const observedAmount = String(form.get("observedAmount") ?? "").trim();
    const observedAmountPaise = parseRupeesToPaise(observedAmount);
    const observedCurrency = String(form.get("observedCurrency") ?? "").trim().toUpperCase();
    const operatorNote = String(form.get("operatorNote") ?? "").trim();
    const evidenceDescriptor = String(form.get("evidenceDescriptor") ?? "").trim();
    const attested = form.get("attested") === "on";
    const errors: Record<string, string[]> = {};
    if (!/^[A-Z0-9][A-Z0-9._:/-]{2,127}$/.test(externalReference)) {
      errors.externalReference = ["Enter the verified external payment reference."];
    }
    if (observedAmountPaise === null) {
      errors.observedAmountPaise = ["Enter a positive INR amount with no more than two decimal places."];
    }
    if (!/^[A-Z]{3}$/.test(observedCurrency)) {
      errors.observedCurrency = ["Enter a three-letter currency code."];
    }
    if (/https?:\/\//i.test(evidenceDescriptor) || /^(data|file):/i.test(evidenceDescriptor)) {
      errors.evidenceDescriptor = ["Describe the evidence without a URL or file payload."];
    }
    if (!attested) {
      errors.attested = ["Confirm that you independently verified the payment."];
    }
    if (Object.keys(errors).length > 0 || observedAmountPaise === null) {
      setFieldErrors(errors);
      setFeedback({
        kind: "error",
        title: "Payment observation not submitted",
        message: "Correct the highlighted fields and complete the attestation.",
      });
      return;
    }

    const normalized = {
      bookingReference: candidate.bookingReference,
      externalReference,
      observedAmountPaise,
      observedCurrency,
      operatorNote,
      evidenceDescriptor,
    };
    const input = {
      ...normalized,
      operatorNote: operatorNote || null,
      evidenceDescriptor: evidenceDescriptor || null,
      requestId: requestIdFor(JSON.stringify(normalized)),
    };

    setPending(true);
    setFieldErrors({});
    setFeedback(null);
    onOperationFeedback?.(null);
    try {
      const result = await verifyManualPaymentAction(input);
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFeedback(failureFeedback(result));
        return;
      }
      clearCompletedIntent();
      if (result.data.result === "reconciliation_required") {
        const completionFeedback: AdminOperationFeedback = {
          kind: "warning",
          title: result.data.applied
            ? "Reconciliation required"
            : "Completed reconciliation result replayed",
          message: result.data.applied
            ? "The observed payment did not match an eligible confirmation. No automatic refund or reconciliation occurred."
            : "The exact previously completed verification was replayed; no second payment verification or automatic reconciliation occurred.",
          details: [
            `Booking status: ${result.data.bookingStatus.replaceAll("_", " ")}`,
            `Payment status: ${result.data.paymentStatus.replaceAll("_", " ")}`,
          ],
          link: { href: "/admin/recovery", label: "Open recovery queue" },
        };
        if (onOperationFeedback) onOperationFeedback(completionFeedback);
        else setFeedback(completionFeedback);
      } else {
        const completionFeedback: AdminOperationFeedback = {
          kind: result.data.applied ? "success" : "replayed",
          title: result.data.applied ? "Manual payment confirmed" : "Completed verification replayed",
          message: result.data.applied
            ? "The server confirmed the verified manual payment. Notification delivery is not claimed."
            : "The exact previously completed verification was returned without a second payment verification.",
          details: [
            `Booking status: ${result.data.bookingStatus.replaceAll("_", " ")}`,
            `Payment status: ${result.data.paymentStatus.replaceAll("_", " ")}`,
          ],
          link: {
            href: `/admin/bookings/${result.data.bookingReference}`,
            label: "Open refreshed booking detail",
          },
        };
        if (onOperationFeedback) onOperationFeedback(completionFeedback);
        else setFeedback(completionFeedback);
      }
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        title: "Connection interrupted",
        message: "The result is unknown. Retry the unchanged verification to safely reuse its request ID.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8 rounded border border-amber-300 bg-amber-50 p-5">
      <h2 className="text-xl font-bold">Verify a manual payment</h2>
      <p className="mt-2 text-sm">
        Record an independently observed external payment. The backend remains authoritative and may require reconciliation.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-stone-600">Booking reference</dt><dd className="font-medium">{candidate.bookingReference}</dd></div>
        <div><dt className="text-stone-600">Expected amount</dt><dd className="font-medium">{formatExpectedAmount(candidate)}</dd></div>
        <div><dt className="text-stone-600">Provider</dt><dd className="font-medium">{candidate.provider.replaceAll("_", " ")}</dd></div>
      </dl>
      <form onSubmit={submit} className="mt-5 space-y-5">
        <fieldset disabled={pending} className="space-y-4">
          <legend className="text-sm font-semibold">Observed external payment</legend>
          <div>
            <label htmlFor="externalPaymentReference" className="text-sm font-medium">External payment reference</label>
            <input
              required
              id="externalPaymentReference"
              name="externalReference"
              maxLength={128}
              autoComplete="off"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "externalReference"))}
              aria-describedby="externalPaymentReference-error"
              className={inputClassName}
            />
            {firstFieldError(fieldErrors, "externalReference") && <p id="externalPaymentReference-error" className={errorClassName}>{firstFieldError(fieldErrors, "externalReference")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="observedPaymentAmount" className="text-sm font-medium">Observed INR amount</label>
              <input
                required
                id="observedPaymentAmount"
                name="observedAmount"
                inputMode="decimal"
                placeholder="12500.50"
                aria-invalid={Boolean(firstFieldError(fieldErrors, "observedAmountPaise"))}
                aria-describedby="observedPaymentAmount-help observedPaymentAmount-error"
                className={inputClassName}
              />
              <p id="observedPaymentAmount-help" className="mt-1 text-xs text-stone-600">Digits with up to two decimal places; no commas.</p>
              {firstFieldError(fieldErrors, "observedAmountPaise") && <p id="observedPaymentAmount-error" className={errorClassName}>{firstFieldError(fieldErrors, "observedAmountPaise")}</p>}
            </div>
            <div>
              <label htmlFor="observedPaymentCurrency" className="text-sm font-medium">Observed currency</label>
              <input
                required
                id="observedPaymentCurrency"
                name="observedCurrency"
                defaultValue={candidate.currency}
                maxLength={3}
                aria-invalid={Boolean(firstFieldError(fieldErrors, "observedCurrency"))}
                aria-describedby="observedPaymentCurrency-help observedPaymentCurrency-error"
                className={inputClassName}
              />
              <p id="observedPaymentCurrency-help" className="mt-1 text-xs text-stone-600">No currency conversion is performed.</p>
              {firstFieldError(fieldErrors, "observedCurrency") && <p id="observedPaymentCurrency-error" className={errorClassName}>{firstFieldError(fieldErrors, "observedCurrency")}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="paymentOperatorNote" className="text-sm font-medium">Operator note (optional)</label>
            <textarea id="paymentOperatorNote" name="operatorNote" maxLength={500} rows={2} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="paymentEvidenceDescriptor" className="text-sm font-medium">Evidence descriptor (optional)</label>
            <input
              id="paymentEvidenceDescriptor"
              name="evidenceDescriptor"
              type="text"
              maxLength={200}
              placeholder="Bank statement entry checked"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "evidenceDescriptor"))}
              aria-describedby="paymentEvidenceDescriptor-help paymentEvidenceDescriptor-error"
              className={inputClassName}
            />
            <p id="paymentEvidenceDescriptor-help" className="mt-1 text-xs text-stone-600">Text description only. Do not enter a URL, file, image or data payload.</p>
            {firstFieldError(fieldErrors, "evidenceDescriptor") && <p id="paymentEvidenceDescriptor-error" className={errorClassName}>{firstFieldError(fieldErrors, "evidenceDescriptor")}</p>}
          </div>
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="attested"
                aria-invalid={Boolean(firstFieldError(fieldErrors, "attested"))}
                aria-describedby="paymentAttestation-error"
                className="mt-1 h-4 w-4"
              />
              <span>I independently verified this payment reference and observed amount against the external payment source.</span>
            </label>
            {firstFieldError(fieldErrors, "attested") && <p id="paymentAttestation-error" className={errorClassName}>{firstFieldError(fieldErrors, "attested")}</p>}
          </div>
        </fieldset>
        <Button type="submit" disabled={pending}>
          {pending ? "Verifying payment…" : "Submit verified payment observation"}
        </Button>
      </form>
      <div className="mt-5">
        <AdminOperationResult ref={resultRef} feedback={feedback} onDismiss={() => setFeedback(null)} />
      </div>
    </section>
  );
}
