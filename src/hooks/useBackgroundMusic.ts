import { useEffect, useRef, useState } from "react";
import { audioManager } from "@/lib/audio";

export type MusicState = "idle" | "loading" | "playing" | "error";

const GAME_MUSIC_PROMPTS = [
  "upbeat chaotic restaurant kitchen background music loop, fun jazzy rhythm with cooking ambience, energetic and cheerful",
  "busy cooking show background music, upbeat percussive rhythm, kitchen sounds, lively restaurant atmosphere loop",
];

const LOBBY_MUSIC_PROMPTS = [
  "calm welcoming restaurant background music, soft acoustic jazz, warm and cozy atmosphere, gentle piano melody",
  "relaxing cafe background music, smooth jazz guitar, pleasant dining ambience, soft and inviting",
];

const NORMAL_VOLUME = 0.14;
const DUCKED_VOLUME = 0.025;

export function useBackgroundMusic(
  chaosLevel: number,
  isActive: boolean,
  calm = false,
): MusicState {
  const [state, setState] = useState<MusicState>("idle");

  // ── Refs ────────────────────────────────────────────────────────────────
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadingRef = useRef(false);
  const isDuckedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // activeRef is updated SYNCHRONOUSLY in the render body (not in a useEffect)
  // so it is always current before any async .then() callbacks execute.
  const activeRef = useRef(isActive);
  activeRef.current = isActive;

  // chaosRef is also kept current in the render body for the same reason.
  const chaosRef = useRef(chaosLevel);
  chaosRef.current = chaosLevel;

  // ── Internal stop helper ─────────────────────────────────────────────────
  // Cancels any in-flight fetch, silences the gain, stops the source node,
  // and clears every ref. Safe to call multiple times (all try/catch guarded).
  const stopEverything = () => {
    // 1. Cancel any fetch that hasn't completed yet.
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // 2. Immediately silence the gain node (avoids a hard click on stop).
    const ctx = audioManager.getSharedContext();
    const gain = gainRef.current;
    if (ctx && gain) {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
      } catch {
        /* ok */
      }
    }

    // 3. Stop the source node.
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        /* already stopped — fine */
      }
      sourceRef.current = null;
    }

    // 4. Clear remaining refs.
    gainRef.current = null;
    loadingRef.current = false;
    isDuckedRef.current = false;

    // 5. Clear the global registry in audioManager.
    audioManager.clearBackgroundAudioRegistry();
  };

  // ── TTS ducking ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = audioManager.onStatus((event) => {
      if (event.channel !== "tts") return;
      const ctx = audioManager.getSharedContext();
      const gain = gainRef.current;
      if (!ctx || !gain) return;

      const now = ctx.currentTime;
      if (event.status === "playing" && !isDuckedRef.current) {
        isDuckedRef.current = true;
        gain.gain.setTargetAtTime(DUCKED_VOLUME, now, 0.1);
      } else if (
        (event.status === "idle" || event.status === "error") &&
        isDuckedRef.current
      ) {
        isDuckedRef.current = false;
        const t = Math.max(0, Math.min(1, chaosRef.current / 100));
        const target = calm ? NORMAL_VOLUME : NORMAL_VOLUME + t * 0.12;
        gain.gain.setTargetAtTime(target, now, 0.2);
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load / unload ────────────────────────────────────────────────────────
  useEffect(() => {
    // ── DEACTIVATE path ───────────────────────────────────────────────────
    if (!isActive) {
      stopEverything();
      setState("idle");
      return;
    }

    // ── ACTIVATE path ─────────────────────────────────────────────────────
    // Guard: don't start a second load if one is already running.
    if (loadingRef.current || sourceRef.current) return;

    loadingRef.current = true;
    setState("loading");

    const pool = calm ? LOBBY_MUSIC_PROMPTS : GAME_MUSIC_PROMPTS;
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    const controller = new AbortController();
    abortRef.current = controller;

    console.log(
      `[Music] Requesting ElevenLabs SFX (${calm ? "lobby" : "game"})…`,
    );

    fetch("/api/sfx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, durationSeconds: 22 }),
      signal: controller.signal,
    })
      .then((res) => {
        // Check activeRef (updated synchronously in render) before proceeding.
        if (!activeRef.current) return null;
        if (!res.ok) throw new Error(`SFX API ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!buffer || !activeRef.current) return null;
        const ctx = audioManager.getSharedContext();
        if (!ctx) throw new Error("AudioContext unavailable");
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return ctx.decodeAudioData(buffer.slice(0));
      })
      .then((decoded) => {
        // Final activeRef check — protects against the window between fetch
        // completion and React's effect cleanup running.
        if (!decoded || !activeRef.current) return;

        const ctx = audioManager.getSharedContext();
        if (!ctx) return;

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();

        source.buffer = decoded;
        source.loop = true;
        source.playbackRate.value = 1.0;
        gain.gain.value = 0; // start silent, fade in below

        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);

        // Fade in over ~2 s.
        gain.gain.setTargetAtTime(NORMAL_VOLUME, ctx.currentTime, 0.7);

        sourceRef.current = source;
        gainRef.current = gain;
        abortRef.current = null;

        // Register with audioManager so page.tsx can also stop it directly.
        audioManager.registerBackgroundAudio(source, gain);

        setState("playing");
        console.log("[Music] ElevenLabs background music started 🎵");
      })
      .catch((err: unknown) => {
        // AbortError is expected when we cancel — not an error worth logging.
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[Music] Failed to load:", err);
        setState("error");
      })
      .finally(() => {
        loadingRef.current = false;
      });

    // ── Cleanup ───────────────────────────────────────────────────────────
    // Runs when isActive flips false OR when the component unmounts.
    // stopEverything() cancels the fetch (AbortController) and stops the
    // source node immediately — no delays.
    return () => {
      stopEverything();
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chaos reactivity ─────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = audioManager.getSharedContext();
    const gain = gainRef.current;
    if (!ctx || !gain || isDuckedRef.current) return;

    const t = calm ? 0 : Math.max(0, Math.min(1, chaosLevel / 100));
    const now = ctx.currentTime;

    gain.gain.setTargetAtTime(NORMAL_VOLUME + t * 0.12, now, 1.2);

    if (sourceRef.current) {
      sourceRef.current.playbackRate.setTargetAtTime(1.0 + t * 0.28, now, 1.5);
    }
  }, [chaosLevel, calm]);

  return state;
}
