"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { Order } from "@/types";
import { useState } from "react";
import VoiceOrderButton from "./VoiceOrderButton";
import { v4 as uuidv4 } from "uuid";

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
}

function OrderCard({ order, isSelected, onClick }: OrderCardProps) {
  const urgency = order.timeLeft / order.timeLimit;

  const statusColors: Record<string, string> = {
    pending: "border-orange-700",
    "in-progress": "border-blue-600",
    completed: "border-green-600",
    failed: "border-red-800",
    disaster: "border-purple-600",
  };

  const statusLabel: Record<string, { icon: string; text: string }> = {
    pending: { icon: "⏳", text: "Waiting" },
    "in-progress": { icon: "👨‍🍳", text: "Cooking" },
    completed: { icon: "✅", text: "Done" },
    failed: { icon: "❌", text: "Failed" },
    disaster: { icon: "💥", text: "DISASTER" },
  };

  const sl = statusLabel[order.status] ?? { icon: "❓", text: order.status };
  const canClick = order.status === "pending";

  return (
    <motion.div
      layout
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={canClick ? onClick : undefined}
      className={`rounded-xl border-2 p-3 transition-all select-none ${statusColors[order.status]} ${
        isSelected
          ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-kitchen-bg"
          : ""
      } ${canClick ? "cursor-pointer hover:brightness-125 active:scale-95" : "cursor-default"} ${
        order.status === "completed" ? "opacity-60" : ""
      }`}
      style={{ background: "rgba(45,21,0,0.9)" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{order.emoji}</span>
          <span className="font-semibold text-sm text-white leading-tight truncate">
            {order.dish}
          </span>
        </div>
        <span className="text-yellow-400 font-display text-sm flex-shrink-0 ml-1">
          +{order.points}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-semibold ${
            order.status === "completed"
              ? "text-green-400"
              : order.status === "failed" || order.status === "disaster"
                ? "text-red-400"
                : "text-orange-300"
          }`}
        >
          {sl.icon} {sl.text}
        </span>
        {(order.status === "pending" || order.status === "in-progress") && (
          <span
            className={`text-xs font-bold ${
              urgency > 0.5
                ? "text-green-400"
                : urgency > 0.25
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            ⏱ {order.timeLeft}s
          </span>
        )}
      </div>

      {(order.status === "pending" || order.status === "in-progress") && (
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              urgency > 0.5
                ? "bg-green-500"
                : urgency > 0.25
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${urgency * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {order.status === "pending" && (
        <p className="mt-1.5 text-center text-xs text-gray-500">
          Tap to assign staff
        </p>
      )}
    </motion.div>
  );
}

export default function OrderBoard() {
  const orders = useGameStore((s) => s.orders);
  const addOrder = useGameStore((s) => s.addOrder);
  const phase = useGameStore((s) => s.phase);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in-progress",
  );
  const doneOrders = orders.filter(
    (o) =>
      o.status === "completed" ||
      o.status === "failed" ||
      o.status === "disaster",
  );

  const handleOrderCreated = (dishName: string) => {
    // Build a custom voice order
    const customEmojis = ["🎤", "🌟", "🔥", "⚡", "💫", "🎸"];
    const order: Order = {
      id: uuidv4(),
      dish: dishName,
      emoji: customEmojis[Math.floor(Math.random() * customEmojis.length)],
      timeLimit: 50,
      timeLeft: 50,
      status: "pending",
      points: 175, // bonus points for voice orders
    };
    addOrder(order);
  };

  return (
    <div className="h-full flex flex-col bg-kitchen-surface/80 rounded-2xl border border-orange-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-orange-900 bg-gradient-to-r from-orange-900/50 to-transparent flex-shrink-0">
        <h2 className="font-display text-2xl text-orange-300">📋 ORDERS</h2>
        <p className="text-xs text-orange-400 opacity-70">
          {activeOrders.length} waiting · Assign to staff
        </p>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedId === order.id}
              onClick={() =>
                setSelectedId(order.id === selectedId ? null : order.id)
              }
            />
          ))}
        </AnimatePresence>

        {activeOrders.length === 0 && (
          <motion.div
            className="text-center text-gray-500 py-8"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-4xl mb-2">😴</div>
            <p className="text-sm">Waiting for orders…</p>
          </motion.div>
        )}

        <AnimatePresence>
          {doneOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={false}
              onClick={() => {}}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Voice Order section */}
      {phase === "playing" && (
        <div className="p-3 border-t border-orange-900 flex-shrink-0 bg-gradient-to-t from-purple-950/30 to-transparent">
          <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
            🎙️ <span>Voice Order</span>
            <span className="text-gray-600 font-normal ml-1">
              — speak your dish
            </span>
          </p>
          <VoiceOrderButton
            onOrderCreated={handleOrderCreated}
            disabled={phase !== "playing"}
          />
        </div>
      )}
    </div>
  );
}
