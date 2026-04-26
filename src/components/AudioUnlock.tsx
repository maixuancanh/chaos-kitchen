"use client";

import { useEffect } from "react";
import { audioManager } from "@/lib/audio";

/**
 * AudioUnlock
 *
 * iOS Safari suspends the AudioContext aggressively — it suspends it on page
 * load, after the app goes to background, and sometimes randomly between
 * interactions.  The only reliable fix is to call ctx.resume() inside a
 * synchronous user-gesture handler (touchstart / click) on every interaction.
 *
 * This component is mounted once in the root layout so the listener is always
 * active regardless of which screen the player is on.
 */
export default function AudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      // Prime creates the context if it doesn't exist yet.
      // After the first user gesture, subsequent calls are instant no-ops.
      const ctx = audioManager.getSharedContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };

    // touchstart fires before click on mobile — this is the most reliable
    // event to use for iOS WebKit audio unlock.
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("touchend",   unlock, { passive: true });
    // Fallback for desktop browsers that use click events.
    document.addEventListener("click",      unlock, { passive: true });

    // Resume when the tab/app comes back into the foreground.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") unlock();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("touchstart",      unlock);
      document.removeEventListener("touchend",        unlock);
      document.removeEventListener("click",           unlock);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Renders nothing — pure side-effect component.
  return null;
}
