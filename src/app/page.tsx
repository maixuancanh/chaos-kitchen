"use client";

import { useEffect, useLayoutEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import MainMenu from "@/components/Screens/MainMenu";
import GameScreen from "@/components/Screens/GameScreen";
import GameOver from "@/components/Screens/GameOver";
import Victory from "@/components/Screens/Victory";
import HireFriend from "@/components/Screens/HireFriend";
import { AnimatePresence, motion } from "framer-motion";
import { audioManager } from "@/lib/audio";

export default function Home() {
  const phase = useGameStore((s) => s.phase);

  // Stop background music on any non-playing phase transition
  useLayoutEffect(() => {
    if (phase !== "playing") {
      audioManager.stopBackgroundAudio();
    }
  }, [phase]);

  return (
    <main className="min-h-screen w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <MainMenu />
          </motion.div>
        )}
        {phase === "playing" && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GameScreen />
          </motion.div>
        )}
        {phase === "game-over" && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameOver />
          </motion.div>
        )}
        {phase === "victory" && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          >
            <Victory />
          </motion.div>
        )}
        {phase === "hire-friend" && (
          <motion.div
            key="hire"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
          >
            <HireFriend />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
