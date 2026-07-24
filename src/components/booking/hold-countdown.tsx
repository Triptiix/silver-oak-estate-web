"use client";

import { useHoldCountdown } from "@/hooks/use-hold-countdown";
import { useEffect } from "react";

type HoldCountdownProps = {
  expiresAt: string;
  onExpire?: () => void;
};

export function HoldCountdown({ expiresAt, onExpire }: HoldCountdownProps) {
  const secondsRemaining = useHoldCountdown(expiresAt);

  useEffect(() => {
    if (secondsRemaining === 0 && onExpire) {
      onExpire();
    }
  }, [secondsRemaining, onExpire]);

  if (secondsRemaining === null) {
    return <div className="text-3xl font-medium tracking-tight text-slate-400">--:--</div>;
  }

  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div className={`text-4xl font-semibold tracking-tight tabular-nums ${secondsRemaining < 60 ? "text-red-600" : "text-slate-900"}`}>
      {timeStr}
    </div>
  );
}
