"use client";

import { motion } from "framer-motion";

interface ChaosOverlayProps {
  chaosLevel: number;
}

export default function ChaosOverlay({ chaosLevel }: ChaosOverlayProps) {
  if (chaosLevel < 30) return null;

  const intensity = (chaosLevel - 30) / 70;

  return (
    <>
      {/* Red vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          boxShadow: `inset 0 0 ${80 + intensity * 120}px rgba(255, ${Math.floor(26 * (1 - intensity))}, 0, ${0.2 + intensity * 0.5})`,
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 0.8 + (1 - intensity) * 0.5, repeat: Infinity }}
      />

      {/* Screen cracks at high chaos */}
      {chaosLevel > 70 && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cline x1='100' y1='0' x2='150' y2='200' stroke='white' stroke-width='1.5'/%3E%3Cline x1='150' y1='200' x2='80' y2='400' stroke='white' stroke-width='1'/%3E%3Cline x1='300' y1='0' x2='250' y2='150' stroke='white' stroke-width='1.5'/%3E%3Cline x1='250' y1='150' x2='320' y2='400' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "cover",
          }}
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Warning text at extreme chaos */}
      {chaosLevel > 80 && (
        <motion.div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="font-display text-4xl text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
            ⚠️ KITCHEN COLLAPSING! ⚠️
          </div>
        </motion.div>
      )}

      {/* Chaos particles */}
      {chaosLevel > 60 &&
        Array.from({ length: Math.floor(intensity * 8) }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl pointer-events-none z-5"
            style={{
              left: `${(i * 13 + 5) % 100}%`,
              top: `${(i * 17 + 10) % 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1 + (i % 3) * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {["💀", "🔥", "💥", "⚡", "🌪️"][i % 5]}
          </motion.div>
        ))}
    </>
  );
}
