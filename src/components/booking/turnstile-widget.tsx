"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { envClient } from "@/lib/env/client";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onSoeTurnstileLoad?: () => void;
  }
}

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  resetSignal?: number;
};

export function TurnstileWidget({ onVerify, resetSignal = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  // Re-run reset when resetSignal changes
  const prevResetSignalRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal > prevResetSignalRef.current) {
      if (widgetId && window.turnstile) {
        window.turnstile.reset(widgetId);
        onVerify(""); // Clear token on reset
      }
      prevResetSignalRef.current = resetSignal;
    }
  }, [resetSignal, widgetId, onVerify]);

  useEffect(() => {
    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;
      
      const id = window.turnstile.render(containerRef.current, {
        sitekey: envClient.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          onVerify(token);
        },
        "expired-callback": () => {
          onVerify("");
        },
        "error-callback": () => {
          onVerify("");
        }
      });
      
      setWidgetId(id);
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onSoeTurnstileLoad = renderWidget;
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
      if (window.onSoeTurnstileLoad === renderWidget) {
        delete window.onSoeTurnstileLoad;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array as we only want to render once

  return (
    <>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onSoeTurnstileLoad" 
        strategy="lazyOnload" 
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
