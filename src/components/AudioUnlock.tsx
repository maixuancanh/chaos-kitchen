"use client";

import { useEffect } from "react";
import { audioManager } from "@/lib/audio";

/**
 * AudioUnlock
 *
 * iOS Safari suspends the AudioContext aggressively — it suspends it on page
 * load, after the app goes to background, and sometimes randomly.
 *
 * Fixes applied:
 *  1. Calls audioManager.prime() (not just ctx.resume()) so the context is
 *     CREATED if it doesn't exist yet, then immediately resumed.
 *  2. Attached to touchstart (fires before click on iOS) so the resume is
 *     always synchronous inside the user-gesture window.
 *  3. Also handles visibilitychange so audio restores after the app
 *     comes back from background.
 */
export default function AudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      // prime() = create context if null + resume if suspended.
      // Safe to call on every touch — it's a no-op when already running.
      audioManager.prime();
    };

    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("touchend", unlock, { passive: true });
    document.addEventListener("click", unlock, { passive: true });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") unlock();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("touchend", unlock);
      document.removeEventListener("click", unlock);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
