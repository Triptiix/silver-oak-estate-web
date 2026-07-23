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
};

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  // We expose a reset function on the container so the parent form can reset the widget.
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement & { resetTurnstile: () => void }).resetTurnstile = () => {
        if (widgetId && window.turnstile) {
          window.turnstile.reset(widgetId);
          onVerify(""); // Clear the token on reset
        }
      };
    }
  }, [widgetId, onVerify]);

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
