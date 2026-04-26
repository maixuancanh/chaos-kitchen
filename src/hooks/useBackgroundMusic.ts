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

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const isDuckedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Sync activeRef and chaosRef in the render body so async callbacks
  // always see the latest value without relying on stale closures.
  const activeRef = useRef(isActive);
  activeRef.current = isActive;

  const chaosRef = useRef(chaosLevel);
  chaosRef.current = chaosLevel;

  // ── Cleanup helper ──────────────────────────────────────────────────────

  const stopEverything = () => {
    // Cancel any in-flight fetch
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Pause and destroy the HTML audio element
    const el = audioElRef.current;
    if (el) {
      try {
        el.pause();
        el.src = "";
        el.load(); // force release on iOS
      } catch {
        /* ok */
      }
      audioElRef.current = null;
    }

    // Revoke the blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    loadingRef.current = false;
    isDuckedRef.current = false;

    // Deregister from audioManager so page.tsx can't double-stop
    audioManager.setBackgroundAudioElement(null);
  };

  // ── TTS ducking ─────────────────────────────────────────────────────────
  // When ElevenLabs TTS starts speaking, quietly lower the music so the
  // voice is clearly audible.  Restore when TTS goes idle/error.

  useEffect(() => {
    const unsub = audioManager.onStatus((event) => {
      if (event.channel !== "tts") return;
      const el = audioElRef.current;
      if (!el) return;

      if (event.status === "playing" && !isDuckedRef.current) {
        isDuckedRef.current = true;
        el.volume = DUCKED_VOLUME;
      } else if (
        (event.status === "idle" || event.status === "error") &&
        isDuckedRef.current
      ) {
        isDuckedRef.current = false;
        const t = Math.max(0, Math.min(1, chaosRef.current / 100));
        el.volume = calm ? NORMAL_VOLUME : NORMAL_VOLUME + t * 0.12;
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load / unload ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActive) {
      stopEverything();
      setState("idle");
      return;
    }

    // Guard: don't start a second load if one is already in flight
    if (loadingRef.current || audioElRef.current) return;

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
        if (!activeRef.current) return null;
        if (!res.ok) throw new Error(`SFX API ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!buffer || !activeRef.current) return;

        // Build a Blob URL from the MP3 binary
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        // Create the HTML5 Audio element
        const audio = new Audio(url);

        // Required for inline playback inside iOS web apps / PWAs
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");
        audio.setAttribute("x-webkit-airplay", "deny");

        audio.loop = true; // seamless loop — no Web Audio needed
        audio.volume = 0; // start silent, ramp below
        audio.preload = "auto";

        // Register with audioManager so page.tsx can stop it via
        // stopBackgroundAudio() during phase transitions.
        audioElRef.current = audio;
        audioManager.setBackgroundAudioElement(audio);

        // play() returns a Promise — on iOS this resolves only if the
        // AudioContext was already unlocked by a prior user gesture.
        return audio.play().then(() => {
          if (!activeRef.current) {
            audio.pause();
            return;
          }

          // Fade volume in gradually so the music doesn't pop on start
          let vol = 0;
          const targetVol = NORMAL_VOLUME;
          const step = targetVol / 40; // 40 steps × 50 ms = 2 s fade-in
          const fadeIn = setInterval(() => {
            if (!audioElRef.current || audioElRef.current !== audio) {
              clearInterval(fadeIn);
              return;
            }
            vol = Math.min(targetVol, vol + step);
            audio.volume = isDuckedRef.current ? DUCKED_VOLUME : vol;
            if (vol >= targetVol) clearInterval(fadeIn);
          }, 50);

          setState("playing");
          console.log("[Music] ElevenLabs background music playing 🎵");
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[Music] Failed to load background music:", err);
        setState("error");
      })
      .finally(() => {
        loadingRef.current = false;
        abortRef.current = null;
      });

    return () => {
      stopEverything();
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chaos reactivity ─────────────────────────────────────────────────────

  useEffect(() => {
    const el = audioElRef.current;
    if (!el || isDuckedRef.current) return;

    const t = calm ? 0 : Math.max(0, Math.min(1, chaosLevel / 100));

    // Volume scales with chaos
    el.volume = NORMAL_VOLUME + t * 0.12;

    // Playback rate: music gets more frantic as chaos rises
    // HTML5 Audio supports playbackRate natively, including on iOS
    el.playbackRate = 1.0 + t * 0.28;
  }, [chaosLevel, calm]);

  return state;
}
