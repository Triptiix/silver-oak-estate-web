"use client";

import { useCallback, useRef } from "react";

export type AdminMutationIntent = {
  requestId: string;
  normalizedIntentKey: string;
};

export function resolveAdminMutationIntent(
  current: AdminMutationIntent | null,
  normalizedIntentKey: string,
  createRequestId: () => string = () => crypto.randomUUID(),
): AdminMutationIntent {
  if (current?.normalizedIntentKey === normalizedIntentKey) return current;
  return {
    requestId: createRequestId(),
    normalizedIntentKey,
  };
}

export function useAdminMutationIntent() {
  const intentRef = useRef<AdminMutationIntent | null>(null);

  const requestIdFor = useCallback((normalizedIntentKey: string) => {
    intentRef.current = resolveAdminMutationIntent(
      intentRef.current,
      normalizedIntentKey,
    );
    return intentRef.current.requestId;
  }, []);

  const clearCompletedIntent = useCallback(() => {
    intentRef.current = null;
  }, []);

  return { requestIdFor, clearCompletedIntent };
}
