"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { DialogueLine } from "@/types";

const typeColors: Record<DialogueLine["type"], string> = {
  success: "border-l-green-500 bg-green-900/20",
  failure: "border-l-yellow-500 bg-yellow-900/20",
  disaster: "border-l-red-500 bg-red-900/20",
  idle: "border-l-gray-500 bg-gray-900/20",
  response: "border-l-blue-500 bg-blue-900/20",
};

const typeEmoji: Record<DialogueLine["type"], string> = {
  success: "✅",
  failure: "❌",
  disaster: "💥",
  idle: "💤",
  response: "💬",
};

export default function DialogueBox() {
  const dialogueLog = useGameStore((s) => s.dialogueLog);

  return (
    <div className="h-48 bg-kitchen-surface/80 rounded-2xl border border-orange-900 overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-orange-900 bg-gradient-to-r from-blue-900/50 to-transparent flex-shrink-0">
        <h3 className="font-display text-lg text-blue-300">💬 STAFF CHATTER</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {dialogueLog.length === 0 ? (
            <motion.p
              className="text-center text-gray-600 text-sm py-4"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Give an order to hear your staff respond...
            </motion.p>
          ) : (
            dialogueLog.map((line) => (
              <motion.div
                key={line.id}
                layout
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`border-l-4 rounded-r-lg px-3 py-2 ${typeColors[line.type]}`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs">{typeEmoji[line.type]}</span>
                  <span className="text-xs font-bold text-orange-300">
                    {line.staffName}:
                  </span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed italic">
                  "{line.text}"
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
