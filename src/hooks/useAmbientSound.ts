import { useEffect, useRef } from "react";
import { audioManager } from "@/lib/audio";

// Three sine-wave oscillators tuned to a C major chord.
// Kept deliberately simple — no filter, no LFO — to eliminate the
// BiquadFilter initial-transient "crackle" that plagued the old version.
const CHORD = [
  { freq: 130.81, vol: 0.042 }, // C3 — warm bass foundation
  { freq: 196.0, vol: 0.028 }, // G3 — perfect fifth (always consonant)
  { freq: 261.63, vol: 0.018 }, // C4 — upper octave (brightness)
];

// How long to wait before oscillators start outputting audio.
// This tiny gap lets the AudioContext graph initialise cleanly and
// avoids the click that appears when gain is still 0 at t=currentTime.
const START_DELAY = 0.08; // seconds

// Fade-in duration (linear ramp)
const FADE_IN_S = 2.5;

// Fade-out and stop within this many milliseconds when deactivated.
// Must be short enough that the user does not hear lingering audio
// after navigating away (e.g. game-over → menu).
const STOP_AFTER_MS = 200;

interface AmbientNodes {
  oscs: OscillatorNode[];
  gains: GainNode[];
}

/**
 * useAmbientSound
 *
 * A minimal, crackle-free sine-wave ambient pad.
 * Plays while `isActive` is true and stops within 200 ms of it becoming false.
 *
 * Design decisions (each chosen to prevent audio artefacts):
 *   • No BiquadFilter  — filters have an initial impulse-response transient
 *                        that sounds like a click when all oscillators start
 *                        simultaneously.  Pure sine waves need no filtering.
 *   • No LFO           — LFO ↔ gain coupling caused subtle pops when the
 *                        modulation frequency and the audio scheduler's
 *                        block boundary coincided.
 *   • Per-oscillator GainNode — each note is independently volume-controlled;
 *                        no shared "master" that could clip on transients.
 *   • Delayed start    — oscillators begin at (currentTime + START_DELAY)
 *                        so the gain schedule is already at 0 when the first
 *                        sample arrives, guaranteeing silence at t=0.
 *   • LinearRampToValueAtTime for fade-in — smoother than setTargetAtTime
 *                        at the very beginning (no asymptotic "snap").
 *   • cancelScheduledValues before stop — prevents a stale ramp from
 *                        briefly un-muting a gain that we just set to 0.
 */
export function useAmbientSound(chaosLevel: number, isActive: boolean): void {
  const nodesRef = useRef<AmbientNodes | null>(null);

  // ── Stop helper ──────────────────────────────────────────────────────────
  // Ramps gain to 0 immediately and schedules oscillator.stop() after
  // STOP_AFTER_MS to give the ramp time to complete without a click.
  const stopNodes = (n: AmbientNodes) => {
    const ctx = audioManager.getSharedContext();
    if (ctx) {
      const now = ctx.currentTime;
      n.gains.forEach((g) => {
        g.gain.cancelScheduledValues(now);
        // Read the live value so the ramp starts from where the gain actually is
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + STOP_AFTER_MS / 1000);
      });
    }
    setTimeout(() => {
      n.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      });
    }, STOP_AFTER_MS + 20); // +20 ms safety margin
  };

  // ── Start / stop effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      if (nodesRef.current) {
        stopNodes(nodesRef.current);
        nodesRef.current = null;
      }
      return;
    }

    // Retry until prime() has been called and the context is running.
    let cancelled = false;
    let retries = 0;

    const tryInit = () => {
      if (cancelled) return;

      const ctx = audioManager.getSharedContext();
      if (!ctx || ctx.state === "closed") {
        if (retries++ < 12) setTimeout(tryInit, 150);
        return;
      }
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // Guard against double-initialisation if the effect runs twice quickly
      if (nodesRef.current) return;

      const now = ctx.currentTime;
      const startAt = now + START_DELAY;
      const endAt = startAt + FADE_IN_S;

      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      CHORD.forEach(({ freq, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        // Gain starts at 0 at startAt, ramps linearly to vol by endAt.
        // Using linearRamp (not setTargetAtTime) avoids the asymptotic
        // "never quite reaches zero" problem during fade-out.
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(vol, endAt);

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Oscillator starts at startAt — the gain is already scheduled to
        // be 0 at that moment, so no audio leaks before the ramp begins.
        osc.start(startAt);

        oscs.push(osc);
        gains.push(gain);
      });

      nodesRef.current = { oscs, gains };
    };

    tryInit();

    // Cleanup: called when isActive flips false OR component unmounts.
    return () => {
      cancelled = true;
      if (nodesRef.current) {
        stopNodes(nodesRef.current);
        nodesRef.current = null;
      }
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chaos reactivity ─────────────────────────────────────────────────────
  // Gently scales each oscillator's volume with the chaos level.
  // Uses setTargetAtTime (slow ramp) so the change is imperceptible.
  useEffect(() => {
    const n = nodesRef.current;
    const ctx = audioManager.getSharedContext();
    if (!n || !ctx) return;

    const t = Math.max(0, Math.min(1, chaosLevel / 100));
    const now = ctx.currentTime;

    CHORD.forEach(({ vol }, i) => {
      if (!n.gains[i]) return;
      // Volume scales from base → base × 2.0 at full chaos
      const target = vol * (1 + t * 1.0);
      n.gains[i].gain.setTargetAtTime(target, now, 1.8);
    });
  }, [chaosLevel]);
}
