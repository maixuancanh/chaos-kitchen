"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import KitchenScene from "@/components/Kitchen/KitchenScene";
import OrderBoard from "@/components/Kitchen/OrderBoard";
import StaffManager from "@/components/Staff/StaffManager";
import ChaosBar from "@/components/UI/ChaosBar";
import DialogueBox from "@/components/UI/DialogueBox";
import ScoreBoard from "@/components/UI/ScoreBoard";
import ChaosOverlay from "@/components/Effects/ChaosOverlay";
import AudioStatusBar from "@/components/UI/AudioStatusBar";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { generateNewOrder } from "@/lib/gameLogic";
import { audioManager } from "@/lib/audio";

const MAX_ACTIVE_ORDERS = 5;
const SPAWN_INTERVAL_MS = 5_000;
const DONE_ORDER_LINGER_MS = 3_000;
const GAME_OVER_CHAOS = 100;
const VICTORY_ORDERS = 15; // Complete 15 orders to win

export default function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const chaosLevel = useGameStore((s) => s.chaosLevel);
  const isShaking = useGameStore((s) => s.isShaking);
  const orders = useGameStore((s) => s.orders);
  const totalCompleted = useGameStore((s) => s.totalCompleted);

  const tickTimers = useGameStore((s) => s.tickTimers);
  const addOrder = useGameStore((s) => s.addOrder);
  const removeOrder = useGameStore((s) => s.removeOrder);
  const setPhase = useGameStore((s) => s.setPhase);
  const addChaos = useGameStore((s) => s.addChaos);
  const updateOrder = useGameStore((s) => s.updateOrder);

  // ── ElevenLabs background music ──────────────────────────────────────────
  const musicState = useBackgroundMusic(chaosLevel, phase === "playing");

  // ── End-game: wait for TTS to finish before transitioning ────────────────
  // endgamePending is set when a trigger condition is met (chaos 100% or
  // 15 completions) but we haven't transitioned yet because staff are talking.
  const [endgamePending, setEndgamePending] = useState<
    "game-over" | "victory" | null
  >(null);

  // Function that performs the actual phase transition.
  const doTransition = useCallback(
    (target: "game-over" | "victory") => {
      setPhase(target);
    },
    [setPhase],
  );

  // When endgamePending is set: wait for TTS to fully finish, then transition.
  //
  // BUG FIX: isSpeaking is only true when status === "playing".
  // When TTS is "loading" (fetching audio from ElevenLabs), isSpeaking is
  // false — so the old check (!audioManager.isSpeaking) would immediately
  // transition while staff audio was still loading and about to play.
  //
  // Fix: use getTTSStatus() which covers all non-idle states:
  //   "idle"    → safe to transition (nothing playing or loading)
  //   "error"   → safe to transition (TTS failed, nothing will play)
  //   "loading" → WAIT  (ElevenLabs fetch in progress, audio imminent)
  //   "playing" → WAIT  (staff voice is audible right now)
  useEffect(() => {
    if (!endgamePending) return;

    // Helper — called immediately and on every subsequent TTS status change.
    const tryTransition = () => {
      const s = audioManager.getTTSStatus();
      if (s === "idle" || s === "error") {
        doTransition(endgamePending);
      }
      // "loading" or "playing" → do nothing; wait for the next status event.
    };

    // Check current status right now.
    tryTransition();

    // Also subscribe so we react the moment TTS becomes idle/error.
    const unsub = audioManager.onStatus((event) => {
      if (event.channel === "tts") {
        tryTransition();
      }
    });

    // Hard safety cap: never wait more than 10 seconds no matter what.
    const safety = setTimeout(() => doTransition(endgamePending), 10_000);

    return () => {
      unsub();
      clearTimeout(safety);
    };
  }, [endgamePending, doTransition]);

  // ── Trigger: chaos 100% → game-over ──────────────────────────────────────
  useEffect(() => {
    if (
      chaosLevel >= GAME_OVER_CHAOS &&
      phase === "playing" &&
      !endgamePending
    ) {
      setEndgamePending("game-over");
    }
  }, [chaosLevel, phase, endgamePending]);

  // ── Trigger: 15 completed orders → victory ────────────────────────────────
  useEffect(() => {
    if (
      totalCompleted >= VICTORY_ORDERS &&
      phase === "playing" &&
      !endgamePending
    ) {
      setEndgamePending("victory");
    }
  }, [totalCompleted, phase, endgamePending]);

  // ── Stable refs for interval callbacks ───────────────────────────────────
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // ── 1 Hz game-loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => tickTimers(), 1_000);
    return () => clearInterval(id);
  }, [phase, tickTimers]);

  // ── Handle orders that reach timeLeft === 0 ───────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    orders.forEach((order) => {
      if (
        order.timeLeft <= 0 &&
        (order.status === "pending" || order.status === "in-progress")
      ) {
        addChaos(15);
        useGameStore.getState().updateOrder(order.id, { status: "failed" });
      }
    });
  }, [orders, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Linger-then-remove completed/failed orders ────────────────────────────
  const lingerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    if (phase !== "playing") return;
    orders.forEach((order) => {
      const isDone =
        order.status === "completed" ||
        order.status === "failed" ||
        order.status === "disaster";
      if (isDone && !lingerTimers.current.has(order.id)) {
        const timer = setTimeout(() => {
          removeOrder(order.id);
          lingerTimers.current.delete(order.id);
        }, DONE_ORDER_LINGER_MS);
        lingerTimers.current.set(order.id, timer);
      }
    });
    const currentIds = new Set(orders.map((o) => o.id));
    lingerTimers.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        lingerTimers.current.delete(id);
      }
    });
  }, [orders, phase, removeOrder]);

  useEffect(() => {
    return () => {
      lingerTimers.current.forEach((timer) => clearTimeout(timer));
      lingerTimers.current.clear();
    };
  }, []);

  // ── Stable spawn interval ─────────────────────────────────────────────────
  const spawnOrder = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const active = ordersRef.current.filter(
      (o) => o.status === "pending" || o.status === "in-progress",
    );
    if (active.length < MAX_ACTIVE_ORDERS) addOrder(generateNewOrder());
  }, [addOrder]);

  useEffect(() => {
    if (phase !== "playing") return;
    spawnOrder();
    const id = setInterval(spawnOrder, SPAWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, spawnOrder]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="min-h-screen flex flex-col relative select-none"
      animate={
        isShaking
          ? { x: [-4, 4, -6, 6, -3, 3, 0], y: [-2, 2, -4, 4, -1, 1, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: "linear-gradient(180deg, #1a0a00 0%, #0d0500 100%)",
      }}
    >
      <ChaosOverlay chaosLevel={chaosLevel} />

      {/* ── Top HUD ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-900 bg-kitchen-surface/80 backdrop-blur-sm z-20 relative flex-shrink-0 gap-3">
        <ScoreBoard />

        <div className="flex flex-col items-center gap-0.5 hidden md:flex">
          <div className="font-display text-2xl text-orange-400 tracking-wide">
            🍳 THE CHAOS KITCHEN
          </div>
          {musicState === "loading" && (
            <div className="flex items-center gap-1.5 text-xs text-purple-400 animate-pulse">
              <span>🎵</span>
              <span>Generating background music…</span>
            </div>
          )}
          {musicState === "playing" && (
            <div className="flex items-center gap-1.5 text-xs text-green-500 opacity-60">
              <span>🎵</span>
              <span>ElevenLabs music playing</span>
            </div>
          )}
          {/* Victory progress indicator */}
          {endgamePending === "victory" && (
            <div className="text-xs text-yellow-400 font-semibold animate-pulse">
              🏆 VICTORY! Finishing up...
            </div>
          )}
          {endgamePending === "game-over" && (
            <div className="text-xs text-red-400 font-semibold animate-pulse">
              💀 Kitchen collapsed! Finishing up...
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <AudioStatusBar />
          {/* Victory progress */}
          <div className="text-xs text-center hidden lg:block">
            <div className="text-gray-400">Orders</div>
            <div
              className={`font-display text-lg ${totalCompleted >= VICTORY_ORDERS ? "text-yellow-400" : "text-orange-300"}`}
            >
              {totalCompleted}/{VICTORY_ORDERS}
            </div>
          </div>
          <div className="w-44">
            <ChaosBar chaosLevel={chaosLevel} />
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden min-h-0">
        <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
          <OrderBoard />
        </div>
        <div className="flex-1 min-w-0 min-h-0">
          <KitchenScene />
        </div>
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <StaffManager />
          </div>
          <div className="flex-shrink-0">
            <DialogueBox />
          </div>
        </div>
      </div>

      {/* ── End-game pending overlay ── */}
      <AnimatePresence>
        {endgamePending && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`px-8 py-4 rounded-2xl border-2 font-display text-3xl text-center ${
                endgamePending === "victory"
                  ? "bg-yellow-950/80 border-yellow-500 text-yellow-300"
                  : "bg-red-950/80 border-red-600 text-red-300"
              }`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              {endgamePending === "victory" ? "🏆 VICTORY!" : "💀 GAME OVER!"}
              <div className="text-sm font-body text-gray-400 mt-1">
                Waiting for staff to finish speaking…
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
