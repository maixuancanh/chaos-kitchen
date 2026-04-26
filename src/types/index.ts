export type StaffRole = "sous-chef" | "waiter" | "pastry-chef" | "cloned";

export type StressLevel =
  | "relaxed"
  | "busy"
  | "stressed"
  | "panicking"
  | "meltdown";

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  voiceId: string;
  personality: string;
  emoji: string;
  successRate: number;
  isCloned?: boolean;
  status: "idle" | "working" | "panicking" | "arguing" | "cloned-recording";
}

export interface Order {
  id: string;
  dish: string;
  emoji: string;
  timeLimit: number;
  timeLeft: number;
  assignedTo?: string;
  status: "pending" | "in-progress" | "completed" | "failed" | "disaster";
  points: number;
}

export interface DialogueLine {
  id: string;
  staffId: string;
  staffName: string;
  text: string;
  type: "success" | "failure" | "disaster" | "idle" | "response";
  timestamp: number;
}

export interface SFXEvent {
  type: "fire" | "crash" | "success" | "explosion" | "cheering" | "custom";
  prompt: string;
}

export type GamePhase =
  | "menu"
  | "playing"
  | "paused"
  | "game-over"
  | "victory"
  | "hire-friend";

export interface GameState {
  phase: GamePhase;
  score: number;
  chaosLevel: number;
  orders: Order[];
  staff: StaffMember[];
  dialogueLog: DialogueLine[];
  isShaking: boolean;
  activeFires: string[];
  streak: number;
  round: number;
  /** Cumulative count of successfully completed orders across the session */
  totalCompleted: number;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  model?: string;
}

export interface VoiceCloneRequest {
  audioBlob: Blob;
  name: string;
}

export interface TTSSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
}
