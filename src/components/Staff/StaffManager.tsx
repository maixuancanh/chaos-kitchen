"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import StaffCard from "./StaffCard";
import {
  calculateSuccessRate,
  rollOutcome,
  getContextDialogue,
  getTTSSettingsForStress,
  getStressLevel,
  createDialogueLine,
  getSFXPrompt,
} from "@/lib/gameLogic";
import { audioManager, AudioStatus } from "@/lib/audio";
import toast from "react-hot-toast";

const SAFETY_TIMEOUT_MS = 14_000;

export default function StaffManager() {
  const staff = useGameStore((s) => s.staff);
  const orders = useGameStore((s) => s.orders);
  const chaosLevel = useGameStore((s) => s.chaosLevel);
  const assignTask = useGameStore((s) => s.assignTask);
  const resolvTask = useGameStore((s) => s.resolvTask);
  const addDialogue = useGameStore((s) => s.addDialogue);
  const setShaking = useGameStore((s) => s.setShaking);
  const addFire = useGameStore((s) => s.addFire);
  const removeFire = useGameStore((s) => s.removeFire);
  const updateStaffStatus = useGameStore((s) => s.updateStaffStatus);

  // Per-staff processing lock — a Set so multiple staff can work simultaneously
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [speakingStaffId, setSpeakingStaffId] = useState<string | null>(null);

  // Claimed orders ref — prevents two rapid taps from claiming the same order
  const claimedOrderIds = useRef<Set<string>>(new Set());

  const markProcessing = (id: string) =>
    setProcessingIds((prev) => new Set([...prev, id]));
  const clearProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });

  // Clear speakingStaffId whenever TTS goes idle/error
  useEffect(() => {
    const unsub = audioManager.onStatus((event) => {
      if (
        event.channel === "tts" &&
        (event.status === "idle" || event.status === "error")
      ) {
        setSpeakingStaffId(null);
      }
    });
    return unsub;
  }, []);

  // First pending order not yet claimed by another in-flight command
  const availablePending = orders.filter(
    (o) => o.status === "pending" && !claimedOrderIds.current.has(o.id),
  );
  const nextOrder = availablePending[0] ?? null;

  // Active order count drives stress level (pending + in-progress)
  const activeOrderCount = orders.filter(
    (o) => o.status === "pending" || o.status === "in-progress",
  ).length;

  const handleCommand = useCallback(
    async (staffId: string) => {
      if (processingIds.has(staffId)) return;

      // Read absolute-latest state to avoid stale closures
      const latestOrders = useGameStore.getState().orders;
      const latestChaos = useGameStore.getState().chaosLevel;
      const latestActive = latestOrders.filter(
        (o) => o.status === "pending" || o.status === "in-progress",
      ).length;

      const pendingOrder =
        latestOrders.find(
          (o) => o.status === "pending" && !claimedOrderIds.current.has(o.id),
        ) ?? null;

      if (!pendingOrder) {
        toast("No orders waiting!", { icon: "📋", duration: 1500 });
        return;
      }

      const staffMember = staff.find((s) => s.id === staffId);
      if (!staffMember) return;

      // Claim order + lock staff
      claimedOrderIds.current.add(pendingOrder.id);
      markProcessing(staffId);
      assignTask(pendingOrder.id, staffId);

      // Safety timeout — always unlocks even if ElevenLabs hangs
      const safetyTimer = setTimeout(() => {
        console.warn(`[StaffManager] Safety unlock for ${staffId}`);
        claimedOrderIds.current.delete(pendingOrder.id);
        clearProcessing(staffId);
        setSpeakingStaffId(null);
        updateStaffStatus(staffId, "idle");
      }, SAFETY_TIMEOUT_MS);

      try {
        // ── Stress-aware outcome ───────────────────────────────────────────
        const stressLevel = getStressLevel(latestChaos, latestActive);
        const successRate = calculateSuccessRate(staffMember, latestChaos);
        const outcome = rollOutcome(successRate);

        // ── Context-aware dialogue ─────────────────────────────────────────
        const dialogue = getContextDialogue(staffId, outcome, stressLevel);

        // ── Stress-aware TTS settings ──────────────────────────────────────
        const ttsSettings = getTTSSettingsForStress(stressLevel, staffId);

        // Push to log immediately
        addDialogue(createDialogueLine(staffMember, dialogue, outcome));

        // Staff avatar animation
        const statusMap = {
          success: "working",
          failure: "arguing",
          disaster: "panicking",
        } as const;
        updateStaffStatus(staffId, statusMap[outcome]);

        // Mark as speaking for waveform animation in StaffCard
        setSpeakingStaffId(staffId);

        // ElevenLabs TTS (async, awaited so we can animate for full duration)
        const ttsPromise = audioManager.playTTS({
          text: dialogue,
          voiceId: staffMember.voiceId,
          stability: ttsSettings.stability,
          similarityBoost: ttsSettings.similarityBoost,
          style: ttsSettings.style,
          speed: ttsSettings.speed,
        });

        // ElevenLabs SFX (fire-and-forget, runs in background)
        if (outcome === "disaster") {
          audioManager.playSFX(Math.random() > 0.5 ? "fire" : "crash", 3);
          addFire(pendingOrder.id);
          setShaking(true);
          setTimeout(() => {
            setShaking(false);
            removeFire(pendingOrder.id);
          }, 3000);
          toast.error(
            `💥 DISASTER! ${staffMember.name} caused a catastrophe!`,
            { duration: 3000 },
          );
        } else if (outcome === "failure") {
          audioManager.playSFX("crash", 2);
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
          toast(`❌ ${staffMember.name} messed it up!`, { duration: 2000 });
        } else {
          audioManager.playSFX("success", 2);
          toast.success(`✅ ${staffMember.name} nailed it!`, {
            duration: 2000,
          });
        }

        // Wait for full voice line before resolving
        await ttsPromise;

        const resolveDelay =
          outcome === "disaster" ? 1800 : outcome === "failure" ? 900 : 500;

        setTimeout(() => {
          clearTimeout(safetyTimer);
          resolvTask(pendingOrder.id, outcome, pendingOrder.points);
          claimedOrderIds.current.delete(pendingOrder.id);
          clearProcessing(staffId);
          setSpeakingStaffId(null);
        }, resolveDelay);
      } catch (err) {
        console.error("[StaffManager] handleCommand error:", err);
        clearTimeout(safetyTimer);
        resolvTask(pendingOrder.id, "failure", pendingOrder.points);
        claimedOrderIds.current.delete(pendingOrder.id);
        clearProcessing(staffId);
        setSpeakingStaffId(null);
        updateStaffStatus(staffId, "idle");
        audioManager.playUISound("failure");
        toast.error("Unknown error — auto-recovering.", { duration: 2000 });
      }
    },
    [
      staff,
      processingIds,
      assignTask,
      resolvTask,
      addDialogue,
      setShaking,
      addFire,
      removeFire,
      updateStaffStatus,
    ],
  );

  // Stress level for display
  const currentStress = getStressLevel(
    chaosLevel,
    orders.filter((o) => o.status === "pending" || o.status === "in-progress")
      .length,
  );

  const stressColors: Record<string, string> = {
    relaxed: "text-green-400",
    busy: "text-yellow-400",
    stressed: "text-orange-400",
    panicking: "text-red-400",
    meltdown: "text-purple-400 animate-pulse",
  };
  const stressLabels: Record<string, string> = {
    relaxed: "😊 Relaxed",
    busy: "😰 Getting Busy",
    stressed: "😤 Stressed",
    panicking: "😱 Panicking!",
    meltdown: "🤯 MELTDOWN!!!",
  };

  return (
    <div className="flex-1 bg-kitchen-surface/80 rounded-2xl border border-orange-900 overflow-hidden flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-orange-900 bg-gradient-to-r from-red-900/50 to-transparent flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-orange-300">👥 STAFF</h2>
          <span className={`text-xs font-bold ${stressColors[currentStress]}`}>
            {stressLabels[currentStress]}
          </span>
        </div>
        {nextOrder ? (
          <p className="text-xs text-orange-400 truncate mt-0.5">
            Next:{" "}
            <span className="text-white">
              {nextOrder.emoji} {nextOrder.dish}
            </span>
            {availablePending.length > 1 && (
              <span className="text-gray-400">
                {" "}
                (+{availablePending.length - 1} more)
              </span>
            )}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">
            {orders.some((o) => o.status === "in-progress")
              ? "⏳ Processing orders..."
              : "📋 Waiting for orders..."}
          </p>
        )}
      </div>

      {/* Staff list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence>
          {staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <StaffCard
                staff={member}
                onCommand={handleCommand}
                pendingOrder={nextOrder}
                isProcessing={processingIds.has(member.id)}
                isSpeaking={speakingStaffId === member.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {staff.length === 0 && (
          <p className="text-center text-gray-600 py-8 text-sm">
            No staff available.
          </p>
        )}
      </div>
    </div>
  );
}
