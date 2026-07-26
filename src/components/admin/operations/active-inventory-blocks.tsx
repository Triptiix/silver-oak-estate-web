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
    <section className="rounded border border-[var(--border)] bg-white p-5">
      <h2 className="text-xl font-bold">Active inventory blocks</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Server-loaded owner and maintenance blocks. Identifiers remain hidden in the interface.
      </p>
      <div className="mt-5">
        <AdminOperationResult
          ref={resultRef}
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      </div>
      {blocks.length === 0 ? (
        <p className="mt-5 rounded bg-stone-50 p-4 text-sm">No active owner or maintenance blocks.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {blocks.map((block) => {
            const canRelease = block.reservationType === "maintenance_block"
              || canManageOwnerBlocks;
            return (
              <li key={block.reservationId} className="rounded border border-stone-200 p-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <div><dt className="text-stone-500">Type</dt><dd className="font-medium">{block.reservationType.replaceAll("_", " ")}</dd></div>
                  <div><dt className="text-stone-500">Start</dt><dd>{formatDateTime(block.startAt)}</dd></div>
                  <div><dt className="text-stone-500">End</dt><dd>{formatDateTime(block.endAt)}</dd></div>
                  <div><dt className="text-stone-500">Status</dt><dd>Active</dd></div>
                  <div><dt className="text-stone-500">Created</dt><dd>{formatDateTime(block.createdAt)}</dd></div>
                </dl>
                {canRelease ? (
                  <ReleaseInventoryBlockForm block={block} onOperationFeedback={setFeedback} />
                ) : (
                  <p className="mt-3 text-sm text-stone-600">
                    Owner-block release requires an admin or super-admin.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
