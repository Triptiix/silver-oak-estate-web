"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminActiveInventoryBlock } from "@/lib/admin/types";
import {
  AdminOperationResult,
  type AdminOperationFeedback,
} from "./admin-operation-result";
import type { AdminUiRole } from "./form-helpers";
import { ReleaseInventoryBlockForm } from "./release-inventory-block-form";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function ActiveInventoryBlocks({
  blocks,
  role,
}: {
  blocks: AdminActiveInventoryBlock[];
  role: AdminUiRole;
}) {
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const canManageOwnerBlocks = role === "admin" || role === "super_admin";

  useEffect(() => {
    if (feedback) resultRef.current?.focus();
  }, [feedback]);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Inventory review
      </p>
      <h2 className="mt-2 text-xl font-bold">Active inventory blocks</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Review complete-property owner and maintenance blocks loaded securely by
        the server. Reservation identifiers remain hidden.
      </p>
      <div className="mt-5">
        <AdminOperationResult
          ref={resultRef}
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      </div>
      {blocks.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5">
          <h3 className="text-sm font-semibold">No active inventory blocks</h3>
          <p className="mt-1 text-sm text-stone-600">
            No active owner or maintenance blocks require review.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {blocks.map((block) => {
            const canRelease = block.reservationType === "maintenance_block"
              || canManageOwnerBlocks;
            return (
              <li key={block.reservationId} className="overflow-hidden rounded-xl border border-stone-200">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold capitalize">
                      {block.reservationType.replaceAll("_", " ")}
                    </h3>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                      <span aria-hidden="true">●</span>
                      Active
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Start</dt><dd className="mt-1 break-words">{formatDateTime(block.startAt)}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">End</dt><dd className="mt-1 break-words">{formatDateTime(block.endAt)}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Created</dt><dd className="mt-1 break-words">{formatDateTime(block.createdAt)}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Scope</dt><dd className="mt-1">Complete property</dd></div>
                  </dl>
                </div>
                <div className="border-t border-stone-200 bg-stone-50 p-4 sm:p-5">
                  {canRelease ? (
                    <ReleaseInventoryBlockForm block={block} onOperationFeedback={setFeedback} />
                  ) : (
                    <p className="text-sm text-stone-600">
                      Owner-block release requires an admin or super-admin.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
