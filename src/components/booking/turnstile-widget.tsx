"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
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
  const widgetIdRef = useRef<string | null>(null);
  const isUnmountedRef = useRef(false);

  // Re-run reset when resetSignal changes
  const prevResetSignalRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal > prevResetSignalRef.current) {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        onVerify(""); // Clear token on reset
      }
      prevResetSignalRef.current = resetSignal;
    }
  }, [resetSignal, onVerify]);

  useEffect(() => {
    isUnmountedRef.current = false;

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current || isUnmountedRef.current) return;
      
      const id = window.turnstile.render(containerRef.current, {
        sitekey: envClient.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          if (!isUnmountedRef.current) onVerify(token);
        },
        "expired-callback": () => {
          if (!isUnmountedRef.current) onVerify("");
        },
        "error-callback": () => {
          if (!isUnmountedRef.current) onVerify("");
        }
      });
      
      widgetIdRef.current = id;
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onSoeTurnstileLoad = renderWidget;
    }

    return () => {
      isUnmountedRef.current = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
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
