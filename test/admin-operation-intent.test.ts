// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  resolveAdminMutationIntent,
  useAdminMutationIntent,
  type AdminMutationIntent,
} from "@/components/admin/operations/use-admin-mutation-intent";

describe("administrator mutation intent", () => {
  it("creates one UUID for the first submission", () => {
    const createRequestId = vi.fn(() => "10000000-0000-4000-8000-000000000001");
    expect(resolveAdminMutationIntent(null, "same-payload", createRequestId)).toEqual({
      requestId: "10000000-0000-4000-8000-000000000001",
      normalizedIntentKey: "same-payload",
    });
    expect(createRequestId).toHaveBeenCalledOnce();
  });

  it("retains the UUID for identical retries, including returned or network failures", () => {
    const current: AdminMutationIntent = {
      requestId: "10000000-0000-4000-8000-000000000001",
      normalizedIntentKey: "same-payload",
    };
    const createRequestId = vi.fn(() => "20000000-0000-4000-8000-000000000002");
    expect(resolveAdminMutationIntent(current, "same-payload", createRequestId)).toBe(current);
    expect(createRequestId).not.toHaveBeenCalled();
  });

  it("rotates the UUID after an idempotency-bound field changes", () => {
    const current: AdminMutationIntent = {
      requestId: "10000000-0000-4000-8000-000000000001",
      normalizedIntentKey: "old-payload",
    };
    expect(resolveAdminMutationIntent(
      current,
      "edited-payload",
      () => "20000000-0000-4000-8000-000000000002",
    )).toEqual({
      requestId: "20000000-0000-4000-8000-000000000002",
      normalizedIntentKey: "edited-payload",
    });
  });

  it("does not rotate an active UUID merely because the hook re-renders", () => {
    const { result, rerender } = renderHook(() => useAdminMutationIntent());
    let first = "";
    act(() => {
      first = result.current.requestIdFor("same-payload");
    });
    rerender();
    expect(result.current.requestIdFor("same-payload")).toBe(first);
  });
});
