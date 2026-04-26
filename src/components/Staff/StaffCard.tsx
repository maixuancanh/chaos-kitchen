"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StaffMember, Order } from "@/types";

interface StaffCardProps {
  staff: StaffMember;
  onCommand: (staffId: string) => void;
  pendingOrder: Order | null;
  isProcessing: boolean;
  isSpeaking?: boolean;
}

const statusEmoji: Record<StaffMember["status"], string> = {
  idle: "💤",
  working: "👨‍🍳",
  panicking: "😱",
  arguing: "😤",
  "cloned-recording": "🎙️",
};

const statusLabel: Record<StaffMember["status"], string> = {
  idle: "Idle",
  working: "Working",
  panicking: "Panicking",
  arguing: "Arguing",
  "cloned-recording": "Recording",
};

const roleColors: Record<StaffMember["role"], string> = {
  "sous-chef": "border-red-700 bg-red-900/20",
  waiter: "border-blue-700 bg-blue-900/20",
  "pastry-chef": "border-pink-700 bg-pink-900/20",
  cloned: "border-purple-700 bg-purple-900/20",
};

const roleLabel: Record<StaffMember["role"], string> = {
  "sous-chef": "Sous-Chef",
  waiter: "Waiter",
  "pastry-chef": "Pastry Chef",
  cloned: "Friend Clone 😂",
};

const roleAccent: Record<StaffMember["role"], string> = {
  "sous-chef": "text-red-400",
  waiter: "text-blue-400",
  "pastry-chef": "text-pink-400",
  cloned: "text-purple-400",
};

/** Animated sound-wave bars shown while the staff member is speaking via TTS */
function SoundWave({ color = "#4ade80" }: { color?: string }) {
  const bars = [0.4, 1.0, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 0.5, 1.0, 0.4];
  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label="Speaking"
      title="Speaking via ElevenLabs TTS"
    >
      {bars.map((baseHeight, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: [
              `${baseHeight * 8}px`,
              `${baseHeight * 22}px`,
              `${baseHeight * 5}px`,
              `${baseHeight * 18}px`,
              `${baseHeight * 8}px`,
            ],
            opacity: [0.7, 1, 0.6, 1, 0.7],
          }}
          transition={{
            duration: 0.6 + i * 0.05,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.06,
          }}
        />
      ))}
    </div>
  );
}

export default function StaffCard({
  staff,
  onCommand,
  pendingOrder,
  isProcessing,
  isSpeaking = false,
}: StaffCardProps) {
  const isAvailable =
    staff.status === "idle" && pendingOrder !== null && !isProcessing;
  const isWorking = staff.status === "working" || isProcessing;

  // Choose wave colour based on role
  const waveColor: Record<StaffMember["role"], string> = {
    "sous-chef": "#f87171",
    waiter: "#60a5fa",
    "pastry-chef": "#f472b6",
    cloned: "#c084fc",
  };

  return (
    <motion.div
      layout
      className={`rounded-xl border-2 p-3 transition-colors select-none ${roleColors[staff.role]} ${
        isAvailable ? "cursor-pointer hover:brightness-125" : "cursor-default"
      } ${isWorking && !isSpeaking ? "opacity-75" : ""} ${
        isSpeaking
          ? "ring-2 ring-green-400 ring-offset-1 ring-offset-kitchen-bg"
          : ""
      }`}
      whileHover={isAvailable ? { scale: 1.02 } : {}}
      whileTap={isAvailable ? { scale: 0.97 } : {}}
    >
      <div className="flex items-center gap-3">
        {/* ── Avatar ── */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="text-4xl"
            animate={
              isSpeaking
                ? { scale: [1, 1.08, 1, 1.05, 1], rotate: [-3, 3, -2, 2, 0] }
                : staff.status === "working"
                  ? { rotate: [-5, 5, -5], y: [-2, 2, -2] }
                  : staff.status === "panicking"
                    ? { x: [-4, 4, -4], scale: [1, 1.12, 1] }
                    : staff.status === "arguing"
                      ? { rotate: [-10, 10, -10] }
                      : { scale: [1, 1.02, 1] }
            }
            transition={{
              duration: isSpeaking ? 0.45 : staff.status === "idle" ? 3 : 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {staff.emoji}
          </motion.div>

          {/* Cloned badge */}
          {staff.isCloned && (
            <span className="absolute -top-1 -right-1 text-xs leading-none">
              🟣
            </span>
          )}

          {/* Speaking indicator dot */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-kitchen-bg"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.4, 1] }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-white leading-tight truncate">
              {staff.name}
            </span>
            {/* ElevenLabs TTS wave — only shown while speaking */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <SoundWave color={waveColor[staff.role]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`text-xs font-semibold ${roleAccent[staff.role]}`}>
            {roleLabel[staff.role]}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs">{statusEmoji[staff.status]}</span>
            <span
              className={`text-xs ${
                isSpeaking
                  ? "text-green-400 font-semibold"
                  : staff.status === "idle"
                    ? "text-gray-400"
                    : staff.status === "working"
                      ? "text-blue-400"
                      : staff.status === "panicking"
                        ? "text-red-400"
                        : "text-yellow-400"
              }`}
            >
              {isSpeaking
                ? "🎙️ Speaking via ElevenLabs..."
                : statusLabel[staff.status]}
            </span>
          </div>
        </div>

        {/* ── Action button ── */}
        <div className="flex-shrink-0">
          {isSpeaking ? (
            /* Speaking state — animated microphone */
            <motion.div
              className="px-2 py-1 text-center"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              title="Speaking via ElevenLabs TTS"
            >
              <div className="text-xl">🎙️</div>
              <div className="text-xs text-green-400 font-semibold">TTS</div>
            </motion.div>
          ) : isProcessing ? (
            /* Loading state — spinning cog */
            <div className="px-2 py-1 text-center">
              <motion.div
                className="text-xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⚙️
              </motion.div>
              <div className="text-xs text-yellow-400">Processing</div>
            </div>
          ) : isAvailable ? (
            /* Ready state — command button */
            <motion.button
              onClick={() => onCommand(staff.id)}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-display text-sm rounded-lg border border-orange-400 transition-colors whitespace-nowrap"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
            >
              GIVE ORDER!
            </motion.button>
          ) : isWorking ? (
            /* Working state */
            <div className="px-2 text-xs text-blue-400 font-semibold text-center">
              <div className="text-lg">👨‍🍳</div>
              <div>Busy</div>
            </div>
          ) : (
            /* No pending order */
            <div className="px-2 text-xs text-gray-600 text-center">
              <div className="text-lg opacity-30">—</div>
              <div className="opacity-50">Standby</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Success-rate bar ── */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-xs text-gray-500 flex-shrink-0">Rate:</span>
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
            style={{ width: `${staff.successRate * 100}%` }}
            layout
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 w-8 text-right">
          {Math.round(staff.successRate * 100)}%
        </span>
      </div>

      {/* ── "Speaking via ElevenLabs" label strip ── */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="mt-2 flex items-center justify-center gap-1.5 text-xs text-green-400 bg-green-950/40 rounded-lg py-1 border border-green-800/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              🟢
            </motion.span>
            <span className="font-semibold">ElevenLabs TTS active</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
