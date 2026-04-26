import { useEffect } from "react";
import { audioManager } from "@/lib/audio";

type EndgameType = "gameover" | "victory";

const PROMPTS: Record<EndgameType, string> = {
  gameover:
    "sad game over jingle, trombone fail sound, defeat music ending, melancholy kitchen",
  victory:
    "triumphant victory fanfare, cheerful celebration music, success achievement jingle, restaurant applause",
};

/**
 * useEndgameMusic
 *
 * Fetches a short (5 s) sound effect from ElevenLabs and plays it ONCE.
 * source.loop = false → plays through naturally then stops.
 *
 * Safety measures:
 *  1. Calls audioManager.stopTTS() first so no lingering staff voice
 *     can overlap with the end-game jingle.
 *  2. Waits 1 200 ms before starting the fetch so the screen transition
 *     animation completes and any in-flight TTS decoding has time to be
 *     cancelled by stopTTS().
 */
export function useEndgameMusic(type: EndgameType): void {
  useEffect(() => {
    let cancelled = false;

    const play = async () => {
      // 1. Immediately silence any staff TTS that might still be playing
      //    or loading (covers the edge case where transition happened just
      //    as a voice line was being decoded).
      audioManager.stopTTS();

      // 2. Wait for the screen entrance animation to finish and for
      //    stopTTS() to take effect before we start the jingle fetch.
      await new Promise<void>((r) => setTimeout(r, 1_200));
      if (cancelled) return;

      try {
        const res = await fetch("/api/sfx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: PROMPTS[type], durationSeconds: 5 }),
        });
        if (!res.ok || cancelled) return;

        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        // Reuse the shared AudioContext; create one if needed (e.g. GameOver
        // is reached without the user having interacted on this visit).
        const ctx =
          audioManager.getSharedContext() ?? audioManager.getContext();
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => {});
        }

        const decoded = await ctx.decodeAudioData(buffer.slice(0));
        if (cancelled) return;

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();

        // Slightly below full volume so it doesn't startle the player.
        gain.gain.value = 0.82;

        source.buffer = decoded;
        source.loop = false; // plays once, then stops automatically

        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);

        console.log(`[EndgameMusic] Playing ${type} jingle 🎶`);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("[EndgameMusic] Failed:", err);
      }
    };

    play();

    return () => {
      cancelled = true;
      // Stop TTS again on unmount in case the component is destroyed early
      // (e.g. user clicks "Play Again" before the fetch completes).
      audioManager.stopTTS();
    };
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps
}
