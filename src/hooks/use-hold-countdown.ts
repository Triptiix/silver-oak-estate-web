import { useState, useEffect } from "react";

export function useHoldCountdown(expiresAt: string | undefined) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsRemaining(null);
      return;
    }

    const expiryTime = new Date(expiresAt).getTime();

    function update() {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setSecondsRemaining(remaining);
      return remaining;
    }

    const initial = update();
    if (initial === 0) return;

    const interval = setInterval(() => {
      const rem = update();
      if (rem === 0) clearInterval(interval);
    }, 1000);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        const rem = update();
        if (rem === 0) clearInterval(interval);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [expiresAt]);

  return secondsRemaining;
}
