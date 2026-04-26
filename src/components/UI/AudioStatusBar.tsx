"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager, AudioStatus } from "@/lib/audio";

interface ChannelState {
  status: AudioStatus;
  error?: string;
}

const STATUS_ICON: Record<AudioStatus, string> = {
  idle: "⚪",
  loading: "🟡",
  playing: "🟢",
  error: "🔴",
};

const STATUS_LABEL: Record<AudioStatus, string> = {
  idle: "Ready",
  loading: "Calling API...",
  playing: "Playing",
  error: "Error",
};

const STATUS_COLOR: Record<AudioStatus, string> = {
  idle: "text-gray-400",
  loading: "text-yellow-400",
  playing: "text-green-400",
  error: "text-red-400",
};

export default function AudioStatusBar() {
  const [tts, setTts] = useState<ChannelState>({ status: "idle" });
  const [sfx, setSfx] = useState<ChannelState>({ status: "idle" });
  const [checking, setChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<{
    tts: boolean;
    sfx: boolean;
    error?: string;
  } | null>(null);
  const [showHealth, setShowHealth] = useState(false);

  useEffect(() => {
    const unsub = audioManager.onStatus((event) => {
      if (event.channel === "tts")
        setTts({ status: event.status, error: event.error });
      else setSfx({ status: event.status, error: event.error });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!healthResult) return;
    const t = setTimeout(() => setHealthResult(null), 6000);
    return () => clearTimeout(t);
  }, [healthResult]);

  const handleHealthCheck = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    setHealthResult(null);
    try {
      const result = await audioManager.checkAPIHealth();
      setHealthResult(result);
    } finally {
      setChecking(false);
    }
  }, [checking]);

  const anyActive = tts.status !== "idle" || sfx.status !== "idle";
  const anyError = tts.status === "error" || sfx.status === "error";

  return (
    <div className="relative">
      <button
        onClick={() => setShowHealth((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
          anyError
            ? "border-red-600 bg-red-900/30 text-red-300"
            : anyActive
              ? "border-green-600 bg-green-900/30 text-green-300"
              : "border-gray-700 bg-gray-900/40 text-gray-400 hover:border-orange-700 hover:text-orange-300"
        }`}
        title="ElevenLabs API status"
      >
        <motion.span
          animate={
            anyActive && !anyError
              ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
              : {}
          }
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-sm leading-none"
        >
          {anyError
            ? "🔴"
            : tts.status === "playing"
              ? "🟢"
              : tts.status === "loading" || sfx.status === "loading"
                ? "🟡"
                : "🎙️"}
        </motion.span>
        <span className="hidden sm:inline">
          {anyError
            ? "API Error"
            : tts.status === "playing"
              ? "Speaking..."
              : tts.status === "loading"
                ? "Generating voice..."
                : sfx.status === "loading"
                  ? "Generating SFX..."
                  : sfx.status === "playing"
                    ? "SFX playing"
                    : "ElevenLabs"}
        </span>
      </button>

      <AnimatePresence>
        {showHealth && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 mt-2 w-72 bg-gray-950 border border-orange-900 rounded-2xl p-4 z-50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-orange-300">
                🎙️ ElevenLabs API
              </h3>
              <button
                onClick={() => setShowHealth(false)}
                className="text-gray-500 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {(
                [
                  { label: "TTS (Voice Lines)", state: tts },
                  { label: "SFX (Sound Effects)", state: sfx },
                ] as const
              ).map(({ label, state }) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-gray-900 rounded-xl px-3 py-2"
                >
                  <span className="text-xs text-gray-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      animate={
                        state.status === "loading" || state.status === "playing"
                          ? { opacity: [1, 0.4, 1] }
                          : {}
                      }
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-sm"
                    >
                      {STATUS_ICON[state.status]}
                    </motion.span>
                    <span
                      className={`text-xs font-semibold ${STATUS_COLOR[state.status]}`}
                    >
                      {STATUS_LABEL[state.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {(tts.error || sfx.error) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-950/60 border border-red-800 rounded-xl px-3 py-2 mb-3 overflow-hidden"
                >
                  <p className="text-xs text-red-300 font-semibold mb-1">
                    ⚠️ Recent error:
                  </p>
                  {tts.error && (
                    <p className="text-xs text-red-200 break-words">
                      TTS: {tts.error}
                    </p>
                  )}
                  {sfx.error && (
                    <p className="text-xs text-red-200 break-words">
                      SFX: {sfx.error}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {healthResult && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl px-3 py-2 mb-3 border ${
                    healthResult.tts && healthResult.sfx
                      ? "bg-green-950/60 border-green-700"
                      : "bg-yellow-950/60 border-yellow-700"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 text-white">
                    Test result:
                  </p>
                  <div className="flex gap-4 text-xs">
                    <span
                      className={
                        healthResult.tts ? "text-green-400" : "text-red-400"
                      }
                    >
                      {healthResult.tts ? "✅" : "❌"} TTS
                    </span>
                    <span
                      className={
                        healthResult.sfx ? "text-green-400" : "text-red-400"
                      }
                    >
                      {healthResult.sfx ? "✅" : "❌"} SFX
                    </span>
                  </div>
                  {healthResult.error && (
                    <p className="text-xs text-yellow-300 mt-1">
                      {healthResult.error}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleHealthCheck}
              disabled={checking}
              className={`w-full py-2.5 font-display text-xl rounded-xl border transition-colors ${
                checking
                  ? "bg-gray-800 border-gray-600 text-gray-500 cursor-wait"
                  : "bg-orange-700 hover:bg-orange-600 border-orange-500 text-white"
              }`}
              whileHover={!checking ? { scale: 1.02 } : {}}
              whileTap={!checking ? { scale: 0.98 } : {}}
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    ⚙️
                  </motion.span>
                  Testing...
                </span>
              ) : (
                "🔬 TEST API CONNECTION"
              )}
            </motion.button>

            <p className="text-xs text-gray-600 mt-3 text-center">
              API key is protected server-side
              <br />
              TTS + SFX call ElevenLabs in real-time
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
