import { TTSRequest } from "@/types";
import { getSFXPrompt } from "./gameLogic";

export type AudioStatus = "idle" | "loading" | "playing" | "error";

export interface AudioStatusEvent {
  channel: "tts" | "sfx";
  status: AudioStatus;
  error?: string;
}

export type UISoundType =
  | "click"
  | "command"
  | "success"
  | "failure"
  | "disaster";

type StatusListener = (event: AudioStatusEvent) => void;

// ---------------------------------------------------------------------------
// AudioManager
//
// AUDIO STRATEGY (revised for iOS compatibility):
//   TTS / SFX  → HTML5 <audio> element  (most reliable on iOS Safari/Chrome)
//   Background  → HTML5 <audio> element  with loop=true  (managed by useBackgroundMusic)
//   UI sounds   → Web Audio oscillators  (instant, no network needed)
//   prime()     → Web Audio silent buffer trick (permanently unlocks iOS audio)
//
// Why HTML5 Audio for TTS/SFX?
//   Web Audio API on iOS requires AudioContext to be resumed inside every
//   synchronous user-gesture handler.  Async playback after a network fetch
//   (1-5 s later) is silently dropped.  HTML5 <audio>.play() only needs ONE
//   user gesture ever — after that it works freely from async code.
// ---------------------------------------------------------------------------

class AudioManager {
  // ── Web Audio context (used ONLY for prime() + UI sounds) ───────────────
  private ctx: AudioContext | null = null;

  // ── HTML5 Audio elements for TTS and SFX ────────────────────────────────
  private ttsAudio: HTMLAudioElement | null = null;
  private sfxAudio: HTMLAudioElement | null = null;
  private ttsBlobUrl: string | null = null;
  private sfxBlobUrl: string | null = null;

  // ── Background music registry (HTMLAudioElement set by useBackgroundMusic) ──
  private bgAudioElement: HTMLAudioElement | null = null;

  // ── Status observable ────────────────────────────────────────────────────
  private ttsStatus: AudioStatus = "idle";
  private sfxStatus: AudioStatus = "idle";
  private listeners: StatusListener[] = [];

  public isSpeaking = false;

  // ── Context lifecycle ────────────────────────────────────────────────────

  /**
   * Call synchronously inside a user-gesture handler (button onClick / touchstart).
   * 1. Creates the AudioContext.
   * 2. Plays a 1-frame silent buffer — the only reliable way to permanently
   *    unlock Web Audio on iOS Safari (used by Phaser, Howler, Three.js, etc.).
   * 3. Resumes the context if suspended.
   */
  prime(): void {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }

    // Silent-buffer unlock — iOS requires an actual AudioBufferSourceNode
    // to be started inside a synchronous gesture handler.
    try {
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch {
      /* older Safari may throw — ignore */
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getSharedContext(): AudioContext | null {
    return this.ctx && this.ctx.state !== "closed" ? this.ctx : null;
  }

  // ── Status observable ────────────────────────────────────────────────────

  onStatus(fn: StatusListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(channel: "tts" | "sfx", status: AudioStatus, error?: string) {
    if (channel === "tts") {
      this.ttsStatus = status;
      this.isSpeaking = status === "playing";
    } else {
      this.sfxStatus = status;
    }
    this.listeners.forEach((fn) => fn({ channel, status, error }));
    if (status === "error") console.error(`[Audio][${channel}] ${error}`);
    else console.log(`[Audio][${channel}] ${status}`);
  }

  // ── Instant UI sounds (Web Audio oscillators — zero latency) ────────────

  playUISound(type: UISoundType): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;

      const tone = (
        freq: number,
        vol: number,
        start: number,
        attack: number,
        hold: number,
        release: number,
      ) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol, start + attack);
        g.gain.setValueAtTime(vol, start + attack + hold);
        g.gain.linearRampToValueAtTime(0, start + attack + hold + release);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + attack + hold + release + 0.01);
      };

      switch (type) {
        case "click":
          tone(880, 0.1, now, 0.005, 0.01, 0.07);
          break;
        case "command":
          tone(330, 0.14, now, 0.005, 0.02, 0.1);
          tone(495, 0.1, now + 0.06, 0.005, 0.01, 0.12);
          break;
        case "success":
          tone(523, 0.11, now, 0.005, 0.02, 0.18);
          tone(659, 0.1, now + 0.08, 0.005, 0.02, 0.18);
          tone(784, 0.1, now + 0.16, 0.005, 0.02, 0.22);
          tone(1047, 0.08, now + 0.24, 0.005, 0.03, 0.28);
          break;
        case "failure":
          tone(440, 0.11, now, 0.005, 0.02, 0.14);
          tone(392, 0.1, now + 0.1, 0.005, 0.02, 0.14);
          tone(330, 0.1, now + 0.22, 0.005, 0.02, 0.22);
          break;
        case "disaster":
          tone(220, 0.11, now, 0.01, 0.05, 0.4);
          tone(233, 0.09, now + 0.04, 0.01, 0.05, 0.45);
          tone(277, 0.08, now + 0.08, 0.01, 0.05, 0.5);
          tone(196, 0.09, now + 0.12, 0.01, 0.05, 0.55);
          tone(165, 0.07, now + 0.18, 0.01, 0.04, 0.5);
          break;
      }
    } catch (err) {
      console.warn("[Audio] playUISound failed:", err);
    }
  }

  // ── Public: Text-to-Speech (HTML5 Audio) ─────────────────────────────────
  //
  // Uses HTMLAudioElement instead of Web Audio API.
  // HTML5 Audio on iOS only requires ONE user gesture ever — after that,
  // .play() works from async code without AudioContext juggling.

  async playTTS(request: TTSRequest): Promise<void> {
    this.emit("tts", "loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          detail = j.details ?? j.error ?? detail;
        } catch {
          /* non-JSON */
        }
        this.emit("tts", "error", `ElevenLabs TTS failed — ${detail}`);
        return;
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength === 0) {
        this.emit("tts", "error", "ElevenLabs returned empty audio");
        return;
      }

      // Stop any currently-playing TTS
      this._stopTTSAudio();

      // Create blob URL and HTMLAudioElement
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1.0;

      // iOS requires playsinline for inline audio playback in web apps
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");

      this.ttsAudio = audio;
      this.ttsBlobUrl = url;
      this.emit("tts", "playing");

      // Await the full duration before resolving (game waits for staff to finish)
      await new Promise<void>((resolve) => {
        const cleanup = () => {
          if (this.ttsBlobUrl === url) {
            URL.revokeObjectURL(url);
            this.ttsAudio = null;
            this.ttsBlobUrl = null;
          }
          resolve();
        };

        // Safety timeout: duration + 4 s
        const safetyMs = 14_000;
        const safety = setTimeout(cleanup, safetyMs);

        audio.addEventListener(
          "ended",
          () => {
            clearTimeout(safety);
            cleanup();
          },
          { once: true },
        );
        audio.addEventListener(
          "error",
          () => {
            clearTimeout(safety);
            cleanup();
          },
          { once: true },
        );

        audio.play().catch((err) => {
          console.warn("[Audio] TTS play() rejected:", err);
          clearTimeout(safety);
          cleanup();
        });
      });

      this.emit("tts", "idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      this.emit("tts", "error", `playTTS failed — ${msg}`);
    }
  }

  // ── Public: Sound Effects (HTML5 Audio, fire-and-forget) ─────────────────

  async playSFX(
    eventType: "fire" | "crash" | "success" | "explosion" | "cheering",
    durationSeconds = 3,
  ): Promise<void> {
    this.emit("sfx", "loading");
    const prompt = getSFXPrompt(eventType);
    try {
      const res = await fetch("/api/sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, durationSeconds }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          detail = j.details ?? j.error ?? detail;
        } catch {
          /* non-JSON */
        }
        this.emit("sfx", "error", `ElevenLabs SFX failed — ${detail}`);
        return;
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength === 0) {
        this.emit("sfx", "error", "ElevenLabs returned empty SFX");
        return;
      }

      // Stop previous SFX
      this._stopSFXAudio();

      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 0.55;
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");

      this.sfxAudio = audio;
      this.sfxBlobUrl = url;
      this.emit("sfx", "playing");

      // Fire-and-forget — cleans up when done
      audio.addEventListener(
        "ended",
        () => {
          URL.revokeObjectURL(url);
          if (this.sfxAudio === audio) {
            this.sfxAudio = null;
            this.sfxBlobUrl = null;
          }
          this.emit("sfx", "idle");
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        () => {
          URL.revokeObjectURL(url);
          if (this.sfxAudio === audio) {
            this.sfxAudio = null;
            this.sfxBlobUrl = null;
          }
          this.emit("sfx", "idle");
        },
        { once: true },
      );

      audio.play().catch((err) => {
        console.warn("[Audio] SFX play() rejected:", err);
        URL.revokeObjectURL(url);
        if (this.sfxAudio === audio) {
          this.sfxAudio = null;
          this.sfxBlobUrl = null;
        }
        this.emit("sfx", "idle");
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      this.emit("sfx", "error", `playSFX failed — ${msg}`);
    }
  }

  // ── Background music registry (used by useBackgroundMusic) ───────────────

  /**
   * Register an HTMLAudioElement as the current background music track.
   * page.tsx calls stopBackgroundAudio() on phase change to stop it.
   */
  setBackgroundAudioElement(el: HTMLAudioElement | null): void {
    this.bgAudioElement = el;
  }

  // Legacy Web Audio registry (kept for backward compat, no-op now)
  registerBackgroundAudio(
    _source: AudioBufferSourceNode,
    _gain: GainNode,
  ): void {}
  clearBackgroundAudioRegistry(): void {}

  stopBackgroundAudio(): void {
    // Stop HTML5 audio element (primary)
    if (this.bgAudioElement) {
      try {
        this.bgAudioElement.pause();
        this.bgAudioElement.src = "";
      } catch {
        /* ok */
      }
      this.bgAudioElement = null;
    }
    console.log("[Audio] Background audio stopped");
  }

  // ── API Health Check ──────────────────────────────────────────────────────

  async checkAPIHealth(): Promise<{
    tts: boolean;
    sfx: boolean;
    error?: string;
  }> {
    console.log("[Audio] Running API health check…");
    let ttsOk = false;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello!",
          voiceId: "pNInz6obpgDQGcFmaJgB",
          stability: 0.5,
          similarityBoost: 0.85,
        }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        ttsOk = buf.byteLength > 0;
        if (ttsOk) {
          // Play test audio
          const blob = new Blob([buf], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = 0.8;
          audio.setAttribute("playsinline", "true");
          await audio.play().catch(() => {});
          URL.revokeObjectURL(url);
        }
      } else {
        console.error("[Audio] TTS health check failed:", await res.text());
      }
    } catch (err) {
      console.error("[Audio] TTS health check threw:", err);
    }

    let sfxOk = false;
    try {
      const res = await fetch("/api/sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Quick ding sound",
          durationSeconds: 1,
        }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        sfxOk = buf.byteLength > 0;
        if (sfxOk) {
          const blob = new Blob([buf], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = 0.5;
          audio.setAttribute("playsinline", "true");
          audio.play().catch(() => {});
          URL.revokeObjectURL(url);
        }
      } else {
        console.error("[Audio] SFX health check failed:", await res.text());
      }
    } catch (err) {
      console.error("[Audio] SFX health check threw:", err);
    }

    return {
      tts: ttsOk,
      sfx: sfxOk,
      error:
        !ttsOk && !sfxOk
          ? "Cannot reach ElevenLabs. Check ELEVENLABS_API_KEY in .env.local"
          : !ttsOk
            ? "TTS failed — check voice IDs and API quota"
            : !sfxOk
              ? "SFX failed — check sound-generation quota"
              : undefined,
    };
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private _stopTTSAudio(): void {
    if (this.ttsAudio) {
      try {
        this.ttsAudio.pause();
      } catch {
        /* ok */
      }
      this.ttsAudio = null;
    }
    if (this.ttsBlobUrl) {
      URL.revokeObjectURL(this.ttsBlobUrl);
      this.ttsBlobUrl = null;
    }
  }

  private _stopSFXAudio(): void {
    if (this.sfxAudio) {
      try {
        this.sfxAudio.pause();
      } catch {
        /* ok */
      }
      this.sfxAudio = null;
    }
    if (this.sfxBlobUrl) {
      URL.revokeObjectURL(this.sfxBlobUrl);
      this.sfxBlobUrl = null;
    }
  }

  // ── Public utilities ──────────────────────────────────────────────────────

  stopTTS(): void {
    this._stopTTSAudio();
    this.isSpeaking = false;
    this.emit("tts", "idle");
  }

  stopSFX(): void {
    this._stopSFXAudio();
    this.emit("sfx", "idle");
  }

  stopAll(): void {
    this.stopTTS();
    this.stopSFX();
  }

  getTTSStatus(): AudioStatus {
    return this.ttsStatus;
  }
  getSFXStatus(): AudioStatus {
    return this.sfxStatus;
  }
}

// Singleton — one instance for the entire app
export const audioManager = new AudioManager();
