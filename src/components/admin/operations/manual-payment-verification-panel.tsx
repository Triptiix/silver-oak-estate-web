"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdminOperationResult,
  type AdminOperationFeedback,
} from "./admin-operation-result";
import {
  ManualPaymentVerificationForm,
  type ManualPaymentCandidate,
} from "./manual-payment-verification-form";

export function ManualPaymentVerificationPanel({
  candidate,
}: {
  candidate: ManualPaymentCandidate | null;
}) {
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedback) resultRef.current?.focus();
  }, [feedback]);

  if (!candidate && !feedback) return null;

  return (
    <section className="mt-8">
      <AdminOperationResult
        ref={resultRef}
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />
      {!feedback && candidate && (
        <ManualPaymentVerificationForm
          candidate={candidate}
          onOperationFeedback={setFeedback}
        />
      )}
    </section>
  );
}
