import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import type { HoldResponse } from "@/types/booking";

const holdSummarySchema = z.object({
  version: z.literal(1),
  bookingReference: z.string(),
  checkInAt: z.string(),
  checkOutAt: z.string(),
  holdExpiresAt: z.string(),
  priceAmountPaise: z.number().int(),
  advanceAmountPaise: z.number().int(),
  balanceAmountPaise: z.number().int(),
  currency: z.string(),
});

export type HoldSummary = z.infer<typeof holdSummarySchema>;

const SESSION_KEY = "soe_hold_summary";

export function useBookingSession() {
  const [holdSummary, setHoldSummary] = useState<HoldSummary | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const result = holdSummarySchema.safeParse(parsed);
        if (result.success) {
          const expiresAt = new Date(result.data.holdExpiresAt).getTime();
          if (Date.now() < expiresAt) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHoldSummary(result.data);
          } else {
            sessionStorage.removeItem(SESSION_KEY);
          }
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveHold = useCallback((data: HoldResponse) => {
    const summary: HoldSummary = { ...data, version: 1 };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(summary));
    setHoldSummary(summary);
  }, []);

  const clearHold = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setHoldSummary(null);
  }, []);

  return { holdSummary, isLoaded, saveHold, clearHold };
}
