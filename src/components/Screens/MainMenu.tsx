"use client";
// Mobile-first responsive layout

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { audioManager } from "@/lib/audio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

const EMOJI_TOP_POSITIONS = [
  39.5, 21.7, 47.0, 56.9, 52.4, 30.2, 66.3, 70.1, 17.2, 19.8,
];
const BG_EMOJIS = ["🍕", "🍜", "🔥", "🥘", "🍣", "💥", "🍳", "🧅", "🥩", "🫕"];

const HOW_TO_PLAY = [
  {
    icon: "📋",
    title: "Receive Orders",
    desc: "Orders appear on the left panel. Each has a timer — let it expire and chaos rises!",
  },
  {
    icon: "👨‍🍳",
    title: "Command Your Staff",
    desc: 'Select an order, then click "GIVE ORDER!" on a staff member to assign it.',
  },
  {
    icon: "🎙️",
    title: "AI Voice Reactions",
    desc: "Staff respond with real ElevenLabs AI voices — tone changes based on stress level!",
  },
  {
    icon: "🌪️",
    title: "Manage Chaos",
    desc: "Failures and disasters raise the Chaos meter. Hit 100% = Game Over!",
  },
  {
    icon: "🏆",
    title: "Win the Game",
    desc: "Complete 15 orders successfully to achieve VICTORY before chaos overwhelms you.",
  },
  {
    icon: "🎤",
    title: "Voice Orders (Mobile)",
    desc: "Tap the 🎤 button to speak your own dish name — ElevenLabs STT creates a custom order!",
  },
];

export default function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const setPhase = useGameStore((s) => s.setPhase);
  const flames = ["🔥", "💥", "🍳", "🔥", "💥"];

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // handleStartAudio is called by the tap-to-start overlay AND by the
  // window event listener.  It must be a plain function (not async) so
  // iOS WebKit treats it as a synchronous user-gesture handler.
  const handleStartAudio = () => {
    if (audioEnabled) return;
    audioManager.prime(); // plays silent buffer → permanently unlocks iOS audio
    setAudioEnabled(true);
  };

  useEffect(() => {
    window.addEventListener("pointerdown", handleStartAudio, { once: true });
    window.addEventListener("keydown", handleStartAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleStartAudio);
      window.removeEventListener("keydown", handleStartAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const musicState = useBackgroundMusic(0, audioEnabled, true);

  const handleStartGame = () => {
    audioManager.prime();
    setAudioEnabled(true);
    startGame();
  };

  const handleHireFriend = () => {
    audioManager.prime();
    setAudioEnabled(true);
    setPhase("hire-friend");
  };

  const musicLabel = !audioEnabled
    ? {
        icon: "🎵",
        text: "Click anywhere to start music",
        cls: "border-orange-800 text-orange-300 bg-orange-950/80",
      }
    : musicState === "loading"
      ? {
          icon: "⏳",
          text: "Loading background music…",
          cls: "border-orange-800 text-orange-300 bg-orange-950/80",
        }
      : musicState === "playing"
        ? {
            icon: "🎵",
            text: "Music playing",
            cls: "border-green-700 text-green-300 bg-green-950/80",
          }
        : musicState === "error"
          ? {
              icon: "🔇",
              text: "Music unavailable — check API key",
              cls: "border-red-800 text-red-300 bg-red-950/80",
            }
          : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden overflow-y-auto"
      style={{
        background:
          "radial-gradient(ellipse at center, #3d1200 0%, #1a0a00 70%)",
      }}
    >
      {/* ── Mobile tap-to-enable overlay ─────────────────────────────────────
          On iOS Safari, Web Audio MUST be unlocked by playing a silent buffer
          inside a synchronous touch handler. This overlay covers the whole
          screen so the very first tap anywhere unlocks audio reliably.
          It disappears instantly after the first touch. */}
      {!audioEnabled && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
          style={{ background: "rgba(10,3,0,0.92)" }}
          onClick={handleStartAudio}
          onTouchStart={handleStartAudio}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            🍳
          </motion.div>
          <div className="font-display text-4xl text-orange-400 mb-3">
            THE CHAOS KITCHEN
          </div>
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-orange-200 text-xl font-semibold">
              👆 Tap anywhere to start
            </div>
            <div className="text-orange-400 text-sm opacity-70">
              🎵 Enables audio · Powered by ElevenLabs
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Floating bg emojis */}
      {BG_EMOJIS.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-10 pointer-events-none"
          style={{ left: `${i * 10 + 3}%`, top: `${EMOJI_TOP_POSITIONS[i]}%` }}
          animate={{ y: [-20, 20, -20], rotate: [-10, 10, -10] }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Music status pill */}
      {musicLabel && (
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${musicLabel.cls}`}
          >
            <motion.span
              animate={
                musicState === "loading"
                  ? { rotate: 360 }
                  : musicState === "playing"
                    ? { scale: [1, 1.3, 1] }
                    : {}
              }
              transition={
                musicState === "loading"
                  ? { duration: 1.2, repeat: Infinity, ease: "linear" }
                  : { duration: 1.4, repeat: Infinity }
              }
            >
              {musicLabel.icon}
            </motion.span>
            <span>{musicLabel.text}</span>
          </div>
        </motion.div>
      )}

      {/* Title */}
      <motion.div
        className="text-center mb-4 md:mb-8 z-10 px-4"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <div className="flex justify-center gap-2 mb-1 text-3xl md:text-5xl">
          {flames.map((f, i) => (
            <motion.span
              key={i}
              animate={{
                scaleY: [1, 1.3, 0.9, 1.1, 1],
                rotate: [-5, 5, -3, 3, 0],
              }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
            >
              {f}
            </motion.span>
          ))}
        </div>

        <h1 className="font-display text-6xl sm:text-8xl md:text-9xl text-orange-400 drop-shadow-[0_0_30px_rgba(255,107,0,0.8)] leading-none">
          THE CHAOS
        </h1>
        <h1 className="font-display text-6xl sm:text-8xl md:text-9xl text-red-500 drop-shadow-[0_0_30px_rgba(255,26,0,0.8)] -mt-2 leading-none">
          KITCHEN
        </h1>
        <p className="text-orange-200 text-sm sm:text-xl mt-2 sm:mt-4 font-semibold">
          Your kitchen. Your useless staff. Your disaster. 🍳
        </p>
      </motion.div>

      {/* Main buttons */}
      <motion.div
        className="flex flex-col gap-2 sm:gap-3 items-center z-10 w-full max-w-sm px-4"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.button
          onClick={handleStartGame}
          className="w-full py-4 sm:py-5 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-display text-3xl sm:text-4xl rounded-2xl pixel-border transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🍳 START COOKING!
        </motion.button>

        <div className="flex gap-2 sm:gap-3 w-full">
          <motion.button
            onClick={handleHireFriend}
            className="flex-1 py-2.5 sm:py-3 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-display text-lg sm:text-2xl rounded-2xl border-2 border-purple-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎙️ HIRE
          </motion.button>
          <motion.button
            onClick={() => setShowHowToPlay((v) => !v)}
            className={`flex-1 py-2.5 sm:py-3 font-display text-lg sm:text-2xl rounded-2xl border-2 transition-colors ${
              showHowToPlay
                ? "bg-blue-700 border-blue-400 text-white"
                : "bg-kitchen-surface border-orange-800 text-orange-300 hover:border-orange-500"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showHowToPlay ? "✕ CLOSE" : "❓ HOW TO"}
          </motion.button>
        </div>
      </motion.div>

      {/* ── HOW TO PLAY panel ── */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            className="z-10 w-full max-w-2xl px-4 mt-2 sm:mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="bg-kitchen-surface/95 rounded-2xl border border-orange-900 p-3 sm:p-5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <h2 className="font-display text-2xl sm:text-3xl text-orange-300 mb-3 text-center">
                📖 HOW TO PLAY
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                {HOW_TO_PLAY.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-3 bg-orange-950/40 rounded-xl p-3 border border-orange-900/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-orange-300 text-sm">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Characters */}
              <div className="border-t border-orange-900/50 pt-4">
                <h3 className="font-display text-xl text-orange-300 mb-3 text-center">
                  🧑‍🍳 YOUR STAFF
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      emoji: "👨‍🍳",
                      name: "Marco",
                      role: "Sous-Chef",
                      desc: "Grumpy but capable. Always blames the equipment.",
                      color: "border-red-700",
                    },
                    {
                      emoji: "🤵",
                      name: "Kevin",
                      role: "Waiter",
                      desc: "Panic mode is his default setting. Very sorry.",
                      color: "border-blue-700",
                    },
                    {
                      emoji: "👩‍🍳",
                      name: "Isabelle",
                      role: "Pastry Chef",
                      desc: "Disasters are art. Failures are experiments.",
                      color: "border-pink-700",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border-2 p-3 text-center ${s.color} bg-kitchen-bg/60`}
                    >
                      <div className="text-3xl mb-1">{s.emoji}</div>
                      <div className="font-display text-sm text-white">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-400">{s.role}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">
                        {s.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ElevenLabs callout */}
              <div className="mt-4 bg-purple-950/40 border border-purple-800 rounded-xl px-4 py-3 text-center text-xs text-purple-300">
                🎙️ All voices, sound effects, and background music are generated
                in real-time by{" "}
                <span className="font-semibold text-purple-200">
                  ElevenLabs AI
                </span>{" "}
                — TTS · SFX · STT · Voice Cloning
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff preview — hidden on very small screens to save space */}
      <motion.div
        className="hidden sm:flex gap-4 sm:gap-6 mt-4 sm:mt-6 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { emoji: "👨‍🍳", name: "Marco", role: "The Grumpy Sous-Chef" },
          { emoji: "🤵", name: "Kevin", role: "The Panicky Waiter" },
          { emoji: "👩‍🍳", name: "Isabelle", role: "The Overconfident Baker" },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1 bg-kitchen-surface rounded-xl p-2 sm:p-3 border border-orange-900"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          >
            <span className="text-2xl sm:text-3xl">{s.emoji}</span>
            <span className="font-display text-base sm:text-lg text-orange-300">
              {s.name}
            </span>
            <span className="text-[10px] sm:text-xs text-orange-200 opacity-70 text-center">
              {s.role}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ElevenLabs badge */}
      <motion.div
        className="absolute bottom-4 right-4 text-xs text-orange-200 opacity-40 z-10 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
      >
        <div>🎙️ Powered by ElevenLabs</div>
        <div>Dynamic AI Voice · Real-time SFX · Voice Cloning</div>
      </motion.div>
    </div>
  );
}
