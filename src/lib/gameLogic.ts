import {
  Order,
  StaffMember,
  DialogueLine,
  StressLevel,
  TTSSettings,
} from "@/types";
import {
  ORDERS_POOL,
  STAFF_CONTEXT_DIALOGUE,
  DIALOGUE_TEMPLATES,
} from "./characters";
import { v4 as uuidv4 } from "uuid";

// ─── Stress level ─────────────────────────────────────────────────────────────

/**
 * Derives the current stress level from game state.
 * Used to select dialogue lines and TTS voice settings.
 */
export function getStressLevel(
  chaosLevel: number,
  activeOrderCount: number,
): StressLevel {
  if (chaosLevel >= 90) return "meltdown";
  if (chaosLevel >= 70 || activeOrderCount >= 4) return "panicking";
  if (chaosLevel >= 50 || activeOrderCount >= 3) return "stressed";
  if (chaosLevel >= 25 || activeOrderCount >= 2) return "busy";
  return "relaxed";
}

// ─── Context-aware dialogue ───────────────────────────────────────────────────

/**
 * Returns a context-appropriate dialogue line for the given staff member.
 * Falls back to the legacy DIALOGUE_TEMPLATES for cloned staff.
 */
export function getContextDialogue(
  staffId: string,
  outcome: "success" | "failure" | "disaster" | "idle",
  stressLevel: StressLevel,
): string {
  // Context-aware system for main staff
  const contextLines =
    STAFF_CONTEXT_DIALOGUE[staffId]?.[stressLevel]?.[outcome];
  if (contextLines && contextLines.length > 0) {
    return contextLines[Math.floor(Math.random() * contextLines.length)];
  }

  // Legacy fallback for cloned staff
  const legacyLines = DIALOGUE_TEMPLATES[staffId]?.[outcome] ??
    DIALOGUE_TEMPLATES["cloned"]?.[outcome] ?? ["..."];
  return legacyLines[Math.floor(Math.random() * legacyLines.length)];
}

// ─── TTS voice settings per stress level ─────────────────────────────────────
//
// stability  : lower = more expressive / unpredictable (sounds human)
// style      : higher = more emotional delivery
// speed      : 0.85 (slow, deliberate) → 1.20 (rushed, frantic)
//
// Character-specific base adjustments reflect their personality archetype.

const STRESS_BASE: Record<
  StressLevel,
  { stability: number; style: number; speed: number }
> = {
  relaxed: { stability: 0.6, style: 0.35, speed: 0.9 },
  busy: { stability: 0.48, style: 0.52, speed: 0.97 },
  stressed: { stability: 0.3, style: 0.68, speed: 1.05 },
  panicking: { stability: 0.13, style: 0.82, speed: 1.13 },
  meltdown: { stability: 0.04, style: 0.95, speed: 1.17 },
};

const CHAR_OFFSET: Record<
  string,
  { stability?: number; style?: number; speed?: number }
> = {
  "sous-chef-marco": { style: 0.0, speed: -0.03 }, // controlled, measured
  "waiter-kevin": { style: 0.08, speed: 0.02 }, // naturally excitable
  "pastry-chef-isabelle": { style: 0.05, stability: -0.04 }, // theatrical
};

export function getTTSSettingsForStress(
  stressLevel: StressLevel,
  staffId: string,
): TTSSettings {
  const base = STRESS_BASE[stressLevel];
  const off = CHAR_OFFSET[staffId] ?? {};

  return {
    stability: Math.max(
      0.02,
      Math.min(1, base.stability + (off.stability ?? 0)),
    ),
    similarityBoost: 0.85,
    style: Math.max(0.0, Math.min(0.98, base.style + (off.style ?? 0))),
    // ElevenLabs hard limit: speed must be in [0.7, 1.2]
    speed: Math.max(0.7, Math.min(1.2, base.speed + (off.speed ?? 0))),
  };
}

// ─── Legacy helpers (kept for backward compat with any remaining callers) ─────

/** @deprecated Use getTTSSettingsForStress instead */
export function getTTSStability(chaosLevel: number): number {
  if (chaosLevel < 25) return 0.6;
  if (chaosLevel < 50) return 0.45;
  if (chaosLevel < 75) return 0.25;
  return 0.08;
}

/** @deprecated Use getTTSSettingsForStress instead */
export function getTTSSimilarityBoost(chaosLevel: number): number {
  return chaosLevel < 50 ? 0.88 : 0.75;
}

// ─── Outcome rolling ─────────────────────────────────────────────────────────

export function calculateSuccessRate(
  staff: StaffMember,
  chaosLevel: number,
): number {
  const chaosModifier = 1 - chaosLevel / 200;
  return Math.max(0.08, staff.successRate * chaosModifier);
}

export function rollOutcome(
  successRate: number,
): "success" | "failure" | "disaster" {
  const roll = Math.random();
  if (roll < successRate) return "success";
  if (roll < successRate + (1 - successRate) * 0.6) return "failure";
  return "disaster";
}

// ─── SFX prompts ─────────────────────────────────────────────────────────────

export function getSFXPrompt(
  event: "fire" | "crash" | "success" | "explosion" | "cheering",
): string {
  const prompts: Record<string, string> = {
    fire: "Loud kitchen fire alarm with sizzling oil sounds and crackling flames",
    crash:
      "Large ceramic plate smashing on a tiled floor with glass shattering",
    success: "Ding of a service bell and cheerful crowd applauding",
    explosion:
      "Small kitchen explosion with surprised gasps and pots clattering",
    cheering: "Restaurant crowd cheering and clapping enthusiastically",
  };
  return prompts[event] ?? "Kitchen ambient noise";
}

// ─── Order generation ────────────────────────────────────────────────────────

export function generateNewOrder(): Order {
  const template = ORDERS_POOL[Math.floor(Math.random() * ORDERS_POOL.length)];
  return {
    id: uuidv4(),
    dish: template.dish,
    emoji: template.emoji,
    timeLimit: template.timeLimit,
    timeLeft: template.timeLimit,
    status: "pending",
    points: template.points,
  };
}

export function calculateChaosChange(
  outcome: "success" | "failure" | "disaster",
): number {
  switch (outcome) {
    case "success":
      return -5;
    case "failure":
      return +10;
    case "disaster":
      return +25;
  }
}

export function createDialogueLine(
  staff: StaffMember,
  text: string,
  type: DialogueLine["type"],
): DialogueLine {
  return {
    id: uuidv4(),
    staffId: staff.id,
    staffName: staff.name,
    text,
    type,
    timestamp: Date.now(),
  };
}
