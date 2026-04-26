"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import FireEffect from "@/components/Effects/FireEffect";

export default function KitchenScene() {
  const { chaosLevel, activeFires, orders } = useGameStore((s) => ({
    chaosLevel: s.chaosLevel,
    activeFires: s.activeFires,
    orders: s.orders,
  }));

  const isOnFire = activeFires.length > 0;
  const activeDisasters = orders.filter((o) => o.status === "disaster");
  const inProgress = orders.filter((o) => o.status === "in-progress");

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden border border-orange-900 relative bg-kitchen-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="font-display text-xl text-orange-200">
          🏭 THE CHAOS KITCHEN
        </span>
        <div className="flex items-center gap-3">
          {isOnFire && (
            <motion.span
              className="text-red-400 font-bold text-sm"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔥 ON FIRE!
            </motion.span>
          )}
          <span
            className={`text-sm font-semibold ${
              chaosLevel < 30
                ? "text-green-400"
                : chaosLevel < 60
                  ? "text-yellow-400"
                  : chaosLevel < 80
                    ? "text-orange-400"
                    : "text-red-400"
            }`}
          >
            Chaos: {chaosLevel}%
          </span>
        </div>
      </div>

      {/* Kitchen visual */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{
          background: isOnFire
            ? "radial-gradient(ellipse at center, #3d0a00 0%, #1a0a00 100%)"
            : chaosLevel > 60
              ? "radial-gradient(ellipse at center, #2a1a00 0%, #1a0a00 100%)"
              : "radial-gradient(ellipse at center, #1f1000 0%, #0d0500 100%)",
        }}
      >
        {/* Counter */}
        <div className="w-full max-w-md px-4">
          <div className="bg-gradient-to-b from-gray-600 to-gray-800 rounded-t-lg h-6 border-t-2 border-gray-400" />
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg p-4 relative border border-gray-700">
            {/* Stove burners */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[0, 1, 2, 3].map((i) => {
                const orderOnBurner = inProgress[i] ?? null;
                return (
                  <div
                    key={i}
                    className="relative flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                        orderOnBurner ? "border-orange-500" : "border-gray-600"
                      }`}
                      style={{
                        background: orderOnBurner
                          ? "radial-gradient(circle, #ff6b00 0%, #cc3300 100%)"
                          : "radial-gradient(circle, #333 0%, #111 100%)",
                        boxShadow: orderOnBurner
                          ? "0 0 20px rgba(255,107,0,0.6)"
                          : "none",
                      }}
                    >
                      {orderOnBurner ? (
                        <motion.span
                          className="text-2xl"
                          animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          {orderOnBurner.emoji}
                        </motion.span>
                      ) : (
                        <div className="grid grid-cols-2 gap-0.5 p-2">
                          {[0, 1, 2, 3].map((j) => (
                            <div
                              key={j}
                              className="w-1.5 h-1.5 rounded-full bg-gray-600"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {orderOnBurner && (
                      <motion.div
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm"
                        animate={{
                          scaleY: [1, 1.3, 0.9, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                      >
                        🔥
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tools */}
            <div className="flex justify-around text-2xl opacity-60 border-t border-gray-700 pt-3">
              <span title="Pan">🥘</span>
              <span title="Skillet">🍳</span>
              <span title="Knife">🔪</span>
              <span title="Chopsticks">🥢</span>
              <span title="Clipboard">📋</span>
            </div>
          </div>
          <div className="mt-2 h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded opacity-50" />
        </div>

        {/* Fire effect */}
        <AnimatePresence>
          {isOnFire && (
            <FireEffect
              key="fire"
              intensity={Math.min(activeFires.length / 2, 1)}
            />
          )}
        </AnimatePresence>

        {/* Disaster overlays */}
        <AnimatePresence>
          {activeDisasters.map((order) => (
            <motion.div
              key={order.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-8xl"
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3, repeat: 6 }}
              >
                💥
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Smoke particles */}
        {chaosLevel > 50 &&
          Array.from({ length: Math.floor(chaosLevel / 25) }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 rounded-full bg-gray-500 pointer-events-none"
              style={{ left: `${20 + i * 20}%`, bottom: "30%" }}
              animate={{ y: -100, opacity: [0.4, 0.1, 0], scale: [1, 2.5, 4] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
      </div>

      {/* Status bar */}
      <div className="bg-gray-900/80 px-4 py-2 text-xs text-gray-400 flex justify-between flex-shrink-0">
        <span>
          🍽️ Cooking: {orders.filter((o) => o.status === "in-progress").length}
        </span>
        <span>
          ✅ Done: {orders.filter((o) => o.status === "completed").length}
        </span>
        <span>
          💀 Failed:{" "}
          {
            orders.filter(
              (o) => o.status === "failed" || o.status === "disaster",
            ).length
          }
        </span>
      </div>
    </div>
  );
}
