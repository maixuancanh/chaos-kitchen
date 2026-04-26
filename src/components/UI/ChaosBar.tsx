"use client";

import { motion } from "framer-motion";

interface ChaosBarProps {
  chaosLevel: number;
}

export default function ChaosBar({ chaosLevel }: ChaosBarProps) {
  const getColor = () => {
    if (chaosLevel < 25) return "from-green-500 to-green-400";
    if (chaosLevel < 50) return "from-yellow-500 to-orange-400";
    if (chaosLevel < 75) return "from-orange-500 to-red-500";
    return "from-red-500 to-purple-500";
  };

  const getLabel = () => {
    if (chaosLevel < 25) return "Under Control";
    if (chaosLevel < 50) return "Getting Hectic";
    if (chaosLevel < 75) return "Total Chaos!";
    return "KITCHEN INFERNO!!!";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-orange-300">🌪️ Chaos</span>
        <motion.span
          className={`text-xs font-bold ${
            chaosLevel < 25
              ? "text-green-400"
              : chaosLevel < 50
                ? "text-yellow-400"
                : chaosLevel < 75
                  ? "text-orange-400"
                  : "text-purple-400"
          }`}
          animate={chaosLevel > 75 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {chaosLevel}% — {getLabel()}
        </motion.span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full relative overflow-hidden`}
          style={{ width: `${chaosLevel}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-white opacity-20"
            style={{ width: "30%" }}
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
