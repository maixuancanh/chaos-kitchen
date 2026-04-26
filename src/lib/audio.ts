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

class AudioManager {
  private ctx: AudioContext | null = null;
  private ttsSource: AudioBufferSourceNode | null = null;
  private sfxSource: AudioBufferSourceNode | null = null;
  private ttsStatus: AudioStatus = "idle";
  private sfxStatus: AudioStatus = "idle";
  private listeners: StatusListener[] = [];
  public isSpeaking = false;

  // ── Background music registry ───────────────────────────────────────────
  // useBackgroundMusic registers its source + gain here so that page.tsx can
  // call stopBackgroundAudio() on phase change as a guaranteed nuclear stop,
  // independent of React's effect cleanup timing.
  private bgSource: AudioBufferSourceNode | null = null;
  private bgGain: GainNode | null = null;

  // ── Context lifecycle ───────────────────────────────────────────────────

  prime(): void {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }

    // ── iOS silent-buffer unlock ─────────────────────────────────────────
    // Calling ctx.resume() alone is NOT enough on iOS Safari.
    // The browser only permanently unlocks Web Audio when an actual
    // AudioBufferSourceNode is started inside a synchronous user-gesture
    // handler.  We play a 1-sample silent buffer — this is the standard
    // technique used by Phaser, Three.js, Howler, and every other game
    // framework that supports iOS.  Without this, source.start() called
    // later in async code (after a network fetch) is silently ignored.
    try {
      const silentBuffer = this.ctx.createBuffer(1, 1, 22050);
      const silentSource = this.ctx.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(this.ctx.destination);
      silentSource.start(0);
    } catch {
      /* older Safari may throw — ignore, the resume() below is the fallback */
    }

    if (this.ctx.state === "suspended") {
      this.ctx
        .resume()
        .catch((e) => console.warn("[Audio] resume() failed:", e));
    }

    console.log(`[Audio] Context primed — state: ${this.ctx.state}`);
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

  // ── Status / listener API ───────────────────────────────────────────────

  onStatus(fn: StatusListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  // ── Background music registry API ──────────────────────────────────────

  /**
   * Called by useBackgroundMusic when a looping background source starts.
   * Overwrites any previously registered source (only one bg track at a time).
   */
  registerBackgroundAudio(source: AudioBufferSourceNode, gain: GainNode): void {
    this.bgSource = source;
    this.bgGain = gain;
  }

  /**
   * Immediately silences and stops the registered background audio source.
   * Called from page.tsx whenever the game phase leaves "playing" so the
   * music stops regardless of hook cleanup timing.
   */
  stopBackgroundAudio(): void {
    const ctx = this.ctx;
    if (ctx && this.bgGain) {
      try {
        this.bgGain.gain.cancelScheduledValues(ctx.currentTime);
        this.bgGain.gain.setValueAtTime(0, ctx.currentTime);
      } catch {
        /* ok */
      }
    }
    if (this.bgSource) {
      try {
        this.bgSource.stop();
      } catch {
        /* already stopped */
      }
      this.bgSource = null;
    }
    this.bgGain = null;
  }

  /**
   * Clears the registry without stopping (used by the hook's own cleanup
   * so the registry doesn't hold stale refs after the hook has already
   * stopped the source itself).
   */
  clearBackgroundAudioRegistry(): void {
    this.bgSource = null;
    this.bgGain = null;
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

  // ── Instant UI sounds (zero-latency, sine waves only = no crackling) ────
  //
  // Rule: NEVER use setValueAtTime for gain — always use linearRamp so
  // there is no discontinuity that causes an audible click/pop.
  // NEVER use sawtooth/square — only sine for smooth, musical tones.

  playUISound(type: UISoundType): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;

      // Shared helper: schedule a smooth sine tone
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

        // Gain envelope — all ramps, never discontinuous
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
        // Short upward blip — button registered
        case "click":
          tone(880, 0.1, now, 0.005, 0.01, 0.07);
          break;

        // Two-note thud — command issued
        case "command":
          tone(330, 0.14, now, 0.005, 0.02, 0.1);
          tone(495, 0.1, now + 0.06, 0.005, 0.01, 0.12);
          break;

        // Ascending major arpeggio — cheerful success
        case "success":
          tone(523, 0.11, now, 0.005, 0.02, 0.18);
          tone(659, 0.1, now + 0.08, 0.005, 0.02, 0.18);
          tone(784, 0.1, now + 0.16, 0.005, 0.02, 0.22);
          tone(1047, 0.08, now + 0.24, 0.005, 0.03, 0.28);
          break;

        // Descending minor line — failure
        case "failure":
          tone(440, 0.11, now, 0.005, 0.02, 0.14);
          tone(392, 0.1, now + 0.1, 0.005, 0.02, 0.14);
          tone(330, 0.1, now + 0.22, 0.005, 0.02, 0.22);
          break;

        // Dissonant cluster — disaster (sine only, staggered = thick but not harsh)
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

  // ── Internal: decode + play a raw ArrayBuffer ───────────────────────────

  private async decodeAndPlay(
    arrayBuffer: ArrayBuffer,
    opts: { channel: "tts" | "sfx"; volume?: number; awaitEnd?: boolean },
  ): Promise<void> {
    const { channel, volume = 1.0, awaitEnd = false } = opts;
    const ctx = this.getContext();

    let decoded: AudioBuffer;
    try {
      decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "decodeAudioData failed";
      this.emit(channel, "error", msg);
      return;
    }

    if (channel === "tts" && this.ttsSource) {
      try {
        this.ttsSource.stop();
      } catch {
        /* already stopped */
      }
      this.ttsSource = null;
    }
    if (channel === "sfx" && this.sfxSource) {
      try {
        this.sfxSource.stop();
      } catch {
        /* already stopped */
      }
      this.sfxSource = null;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(2, volume));
    source.buffer = decoded;
    source.connect(gain);
    gain.connect(ctx.destination);

    if (channel === "tts") this.ttsSource = source;
    else this.sfxSource = source;

    // ── iOS critical fix ────────────────────────────────────────────────────
    // The AudioContext can be suspended by iOS between the network fetch and
    // this point (fetch takes 1–5 s; iOS kills audio after ~0.5 s of silence).
    // We must await resume() here — NOT just fire-and-forget — so the context
    // is guaranteed to be in "running" state before source.start(0) is called.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* Safari sometimes rejects resume() outside a gesture — best effort */
      }
    }

    this.emit(channel, "playing");

    if (awaitEnd) {
      await new Promise<void>((resolve) => {
        const safetyMs = (decoded.duration + 4) * 1000;
        const safety = setTimeout(() => {
          console.warn(`[Audio][${channel}] onended safety timeout`);
          resolve();
        }, safetyMs);
        source.onended = () => {
          clearTimeout(safety);
          resolve();
        };
        source.start(0);
      });
      this.emit(channel, "idle");
      if (channel === "tts") this.ttsSource = null;
    } else {
      source.start(0);
      source.onended = () => {
        if (this.sfxSource === source) this.sfxSource = null;
        this.emit("sfx", "idle");
      };
    }
  }

  // ── Public: Text-to-Speech ──────────────────────────────────────────────

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
        this.emit("tts", "error", "ElevenLabs returned empty audio buffer");
        return;
      }

      await this.decodeAndPlay(buffer, {
        channel: "tts",
        volume: 1.0,
        awaitEnd: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      this.emit("tts", "error", `playTTS failed — ${msg}`);
    }
  }

  // ── Public: Sound Effects ───────────────────────────────────────────────

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
        this.emit("sfx", "error", "ElevenLabs returned empty SFX buffer");
        return;
      }

      await this.decodeAndPlay(buffer, {
        channel: "sfx",
        volume: 0.55,
        awaitEnd: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      this.emit("sfx", "error", `playSFX failed — ${msg}`);
    }
  }

  // ── Public: API Health Check ────────────────────────────────────────────

  async checkAPIHealth(): Promise<{
    tts: boolean;
    sfx: boolean;
    error?: string;
  }> {
    console.log("[Audio] Running API health check...");
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
        if (ttsOk)
          await this.decodeAndPlay(buf, {
            channel: "tts",
            volume: 0.8,
            awaitEnd: true,
          });
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
        if (sfxOk)
          await this.decodeAndPlay(buf, {
            channel: "sfx",
            volume: 0.5,
            awaitEnd: false,
          });
      } else {
        console.error("[Audio] SFX health check failed:", await res.text());
      }
    } catch (err) {
      console.error("[Audio] SFX health check threw:", err);
    }

    console.log(`[Audio] Health check — TTS: ${ttsOk}, SFX: ${sfxOk}`);
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

  // ── Utilities ───────────────────────────────────────────────────────────

  stopTTS(): void {
    if (this.ttsSource) {
      try {
        this.ttsSource.stop();
      } catch {
        /* already stopped */
      }
      this.ttsSource = null;
    }
    this.isSpeaking = false;
    this.emit("tts", "idle");
  }

  stopSFX(): void {
    if (this.sfxSource) {
      try {
        this.sfxSource.stop();
      } catch {
        /* already stopped */
      }
      this.sfxSource = null;
    }
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

export const audioManager = new AudioManager();
