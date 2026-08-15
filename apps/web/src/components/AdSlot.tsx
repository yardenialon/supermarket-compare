"use client";
import { useEffect, useRef } from "react";
import { AD_CLIENT } from "@/lib/ads";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

/**
 * CLS-safe responsive AdSense unit.
 * - Renders nothing when `slot` is empty (placement disabled).
 * - Reserves vertical space up front so the ad never pushes content around.
 * - Pushes to adsbygoogle exactly once per mount.
 */
export default function AdSlot({ slot, minHeight = 280 }: { slot: string; minHeight?: number }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not loaded (blocked or offline) — leave the reserved space empty
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className="my-6 text-center" style={{ minHeight }} aria-hidden="true">
      <div className="text-[9px] text-stone-300 mb-1">פרסומת</div>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: minHeight - 16 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
