"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useEndgameMusic } from "@/hooks/useEndgameMusic";
import { audioManager } from "@/lib/audio";

export default function GameOver() {
  const score = useGameStore((s) => s.score);
  const chaosLevel = useGameStore((s) => s.chaosLevel);
  const streak = useGameStore((s) => s.streak);
  const totalCompleted = useGameStore((s) => s.totalCompleted);
  const startGame = useGameStore((s) => s.startGame);
  const setPhase = useGameStore((s) => s.setPhase);

  // Play game-over jingle when screen appears (short, plays once)
  useEndgameMusic("gameover");

  const getRating = () => {
    if (score >= 1500)
      return {
        label: "Legendary Head Chef",
        emoji: "🏆",
        color: "text-yellow-400",
      };
    if (score >= 1000)
      return {
        label: "Certified Head Chef",
        emoji: "⭐",
        color: "text-orange-400",
      };
    if (score >= 500)
      return { label: "Trainee Cook", emoji: "🍳", color: "text-blue-400" };
    return {
      label: "Culinary Catastrophe",
      emoji: "💀",
      color: "text-red-400",
    };
  };

  const rating = getRating();

  const handlePlayAgain = () => {
    audioManager.prime();
    startGame();
  };

  const handleMenu = () => {
    audioManager.prime();
    setPhase("menu");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #2a0a0a 0%, #1a0a00 70%)",
      }}
    >
      {/* Smoke particles — static X positions to avoid hydration mismatch */}
      {[10, 22, 34, 46, 58, 70, 82, 94].map((x, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 rounded-full bg-gray-500 opacity-20 pointer-events-none"
          style={{ left: `${x}%`, bottom: "0%" }}
          animate={{ y: -400, opacity: [0.3, 0.1, 0], scale: [1, 2, 3] }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}

      <motion.div
        className="text-center z-10 max-w-lg px-4"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      >
        <div className="text-8xl mb-4">💀</div>

        <h1 className="font-display text-7xl text-red-500 mb-2">GAME OVER!</h1>
        <p className="text-orange-300 text-xl mb-8">
          Your kitchen… no longer exists.
        </p>

        {/* Stats card */}
        <div className="bg-kitchen-surface rounded-2xl p-6 mb-8 border border-orange-900 space-y-4">
          <div className={`text-5xl font-display ${rating.color}`}>
            {rating.emoji} {rating.label}
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <div className="text-3xl font-display text-orange-400">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-green-400">
                {totalCompleted}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-red-400">
                {chaosLevel}%
              </div>
              <div className="text-sm text-gray-400">Chaos Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-yellow-400">
                {streak}
              </div>
              <div className="text-sm text-gray-400">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <motion.button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-400 font-display text-3xl rounded-xl border-2 border-orange-300 text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 TRY AGAIN
          </motion.button>
          <motion.button
            onClick={handleMenu}
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
