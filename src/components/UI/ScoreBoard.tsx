"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useEffect, useRef, useState } from "react";

export default function ScoreBoard() {
  const { score, streak } = useGameStore((s) => ({
    score: s.score,
    streak: s.streak,
  }));
  const prevScore = useRef(score);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  useEffect(() => {
    if (score !== prevScore.current) {
      const delta = score - prevScore.current;
      setScoreDelta(delta);
      prevScore.current = score;
      const timeout = setTimeout(() => setScoreDelta(null), 1500);
      return () => clearTimeout(timeout);
    }
  }, [score]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          Score
        </div>
        <motion.div
          key={score}
          className="font-display text-3xl text-yellow-400"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {score.toLocaleString()}
        </motion.div>
        {/* Floating score delta */}
        <AnimatePresence>
          {scoreDelta !== null && (
            <motion.div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 font-display text-xl pointer-events-none whitespace-nowrap ${
                scoreDelta > 0 ? "text-green-400" : "text-red-400"
              }`}
              initial={{ y: 0, opacity: 1, scale: 1.2 }}
              animate={{ y: -30, opacity: 0, scale: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {streak > 1 && (
        <motion.div
          className="flex items-center gap-1 bg-orange-900/50 rounded-lg px-2 py-1 border border-orange-700"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring" }}
        >
          <span className="text-lg">🔥</span>
          <div>
            <div className="text-xs text-orange-300 font-semibold leading-none">
              STREAK
            </div>
            <div className="font-display text-xl text-orange-400 leading-none">
              ×{streak}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
