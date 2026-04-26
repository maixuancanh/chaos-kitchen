"use client";

import { motion } from "framer-motion";

interface FireEffectProps {
  intensity?: number; // 0-1
}

export default function FireEffect({ intensity = 0.5 }: FireEffectProps) {
  const flameCount = Math.floor(3 + intensity * 7);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Red tint overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at bottom, rgba(255,50,0,0.3) 0%, transparent 70%)" }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />

      {/* Individual flames */}
      {Array.from({ length: flameCount }).map((_, i) => {
        const x = 5 + (i / flameCount) * 90;
        const delay = i * 0.15;
        const size = 30 + Math.random() * 40;
        return (
          <motion.div key={i}
            className="absolute bottom-0 select-none"
            style={{ left: `${x}%`, fontSize: `${size}px` }}
            animate={{
              y: [0, -(size * 1.5), -(size * 0.8), -(size * 2)],
              scaleX: [1, 0.8, 1.2, 0.9],
              scaleY: [1, 1.3, 0.8, 1.1],
              opacity: [0.9, 1, 0.8, 0],
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.6,
              repeat: Infinity,
              delay,
              ease: "easeOut",
            }}>
            🔥
          </motion.div>
        );
      })}

      {/* Smoke particles */}
      {Array.from({ length: Math.floor(intensity * 5) }).map((_, i) => (
        <motion.div key={`smoke-${i}`}
          className="absolute w-8 h-8 rounded-full bg-gray-600 pointer-events-none"
          style={{ left: `${20 + i * 15}%`, bottom: "15%" }}
          animate={{
            y: -200,
            x: [-10, 10, -5, 15],
            opacity: [0.3, 0.15, 0],
            scale: [1, 2, 4],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }} />
      ))}
    </div>
  );
}
