"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useEndgameMusic } from "@/hooks/useEndgameMusic";

const VICTORY_ORDERS = 15;

export default function Victory() {
  const score = useGameStore((s) => s.score);
  const chaosLevel = useGameStore((s) => s.chaosLevel);
  const streak = useGameStore((s) => s.streak);
  const totalCompleted = useGameStore((s) => s.totalCompleted);
  const startGame = useGameStore((s) => s.startGame);
  const setPhase = useGameStore((s) => s.setPhase);

  // Play victory jingle when screen mounts (short, plays once)
  useEndgameMusic("victory");

  const getRating = () => {
    if (chaosLevel < 30)
      return {
        label: "Flawless Victory",
        emoji: "🌟",
        color: "text-yellow-300",
      };
    if (chaosLevel < 60)
      return { label: "Skilled Chef", emoji: "🏆", color: "text-orange-300" };
    return { label: "Chaos Survivor", emoji: "🎖️", color: "text-green-400" };
  };
  const rating = getRating();

  // Confetti particles (static positions to avoid SSR mismatch)
  const CONFETTI = [
    { x: 10, y: 15, c: "#ffd700" },
    { x: 25, y: 8, c: "#ff6b00" },
    { x: 40, y: 20, c: "#00cc44" },
    { x: 55, y: 5, c: "#ff00cc" },
    { x: 70, y: 18, c: "#00aaff" },
    { x: 85, y: 12, c: "#ffd700" },
    { x: 15, y: 80, c: "#ff6b00" },
    { x: 30, y: 75, c: "#00cc44" },
    { x: 50, y: 85, c: "#ff00cc" },
    { x: 75, y: 78, c: "#00aaff" },
    { x: 90, y: 82, c: "#ffd700" },
    { x: 60, y: 90, c: "#ff6b00" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #0d2a00 0%, #1a0a00 70%)",
      }}
    >
      {/* Confetti particles */}
      {CONFETTI.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.c }}
          animate={{
            y: [0, -30, 0, -15, 0],
            rotate: [0, 180, 360],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="text-center z-10 max-w-lg px-4"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      >
        {/* Trophy + fireworks */}
        <motion.div
          className="text-9xl mb-4"
          animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5, 5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
        >
          🏆
        </motion.div>

        <h1 className="font-display text-7xl text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] mb-2">
          VICTORY!
        </h1>
        <p className="text-green-300 text-xl mb-8">
          You served all {VICTORY_ORDERS} orders and survived the chaos!
        </p>

        {/* Stats card */}
        <div className="bg-kitchen-surface rounded-2xl p-6 mb-8 border border-yellow-700 space-y-4">
          <div className={`text-5xl font-display ${rating.color}`}>
            {rating.emoji} {rating.label}
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <div className="text-3xl font-display text-orange-400">
                {score.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-green-400">
                {totalCompleted}
              </div>
              <div className="text-xs text-gray-400">Orders Done</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-red-400">
                {chaosLevel}%
              </div>
              <div className="text-xs text-gray-400">Final Chaos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-yellow-400">
                {streak}
              </div>
              <div className="text-xs text-gray-400">Best Streak</div>
            </div>
          </div>
        </div>

        {/* ElevenLabs callout */}
        <div className="bg-purple-950/40 border border-purple-700 rounded-xl px-4 py-3 mb-6 text-sm text-purple-300">
          🎙️ Powered by ElevenLabs — Dynamic AI Voice · Real-time SFX · Voice
          Cloning
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <motion.button
            onClick={startGame}
            className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 font-display text-3xl rounded-xl border-2 border-yellow-400 text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 PLAY AGAIN
          </motion.button>
          <motion.button
            onClick={() => setPhase("menu")}
            className="px-8 py-4 bg-kitchen-surface hover:bg-gray-800 font-display text-3xl rounded-xl border-2 border-orange-900 text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 MENU
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
