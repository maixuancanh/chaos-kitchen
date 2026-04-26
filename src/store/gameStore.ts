import { create } from "zustand";
import {
  GameState,
  GamePhase,
  Order,
  StaffMember,
  DialogueLine,
} from "@/types";
import { DEFAULT_STAFF } from "@/lib/characters";
import { generateNewOrder, calculateChaosChange } from "@/lib/gameLogic";
import { v4 as uuidv4 } from "uuid";

interface GameActions {
  setPhase: (phase: GamePhase) => void;
  startGame: () => void;
  resetGame: () => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  tickTimers: () => void;
  assignTask: (orderId: string, staffId: string) => void;
  resolvTask: (
    orderId: string,
    outcome: "success" | "failure" | "disaster",
    points: number,
  ) => void;
  addDialogue: (line: DialogueLine) => void;
  clearDialogue: () => void;
  setChaosLevel: (level: number) => void;
  addChaos: (amount: number) => void;
  setShaking: (shaking: boolean) => void;
  addFire: (orderId: string) => void;
  removeFire: (orderId: string) => void;
  addScore: (points: number) => void;
  addClonedStaff: (staff: StaffMember) => void;
  updateStaffStatus: (staffId: string, status: StaffMember["status"]) => void;
  spawnInitialOrders: () => void;
  incrementCompleted: () => void;
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  phase: "menu",
  score: 0,
  chaosLevel: 0,
  orders: [],
  staff: DEFAULT_STAFF.map((s) => ({ ...s, status: "idle" })),
  dialogueLog: [],
  isShaking: false,
  activeFires: [],
  streak: 0,
  round: 1,
  totalCompleted: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  startGame: () => {
    const orders = [
      generateNewOrder(),
      generateNewOrder(),
      generateNewOrder(),
      generateNewOrder(),
    ];
    set({
      ...initialState,
      phase: "playing",
      orders,
      staff: DEFAULT_STAFF.map((s) => ({ ...s, status: "idle" })),
    });
  },

  resetGame: () => set({ ...initialState }),

  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),

  updateOrder: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o,
      ),
    })),

  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    })),

  tickTimers: () =>
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.status === "pending" || order.status === "in-progress") {
          const newTime = order.timeLeft - 1;
          if (newTime <= 0) {
            return { ...order, timeLeft: 0, status: "failed" as const };
          }
          return { ...order, timeLeft: newTime };
        }
        return order;
      });
      return { orders: updatedOrders };
    }),

  assignTask: (orderId, staffId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, assignedTo: staffId, status: "in-progress" }
          : o,
      ),
      staff: state.staff.map((s) =>
        s.id === staffId ? { ...s, status: "working" } : s,
      ),
    })),

  resolvTask: (orderId, outcome, points) =>
    set((state) => {
      const chaosChange = calculateChaosChange(outcome);
      const newChaos = Math.min(
        100,
        Math.max(0, state.chaosLevel + chaosChange),
      );
      const newScore =
        outcome === "success"
          ? state.score + points
          : Math.max(0, state.score - Math.floor(points * 0.2));
      const newStreak = outcome === "success" ? state.streak + 1 : 0;

      const order = state.orders.find((o) => o.id === orderId);
      return {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status:
                  outcome === "success"
                    ? "completed"
                    : outcome === "disaster"
                      ? "disaster"
                      : "failed",
              }
            : o,
        ),
        staff: state.staff.map((s) =>
          s.id === order?.assignedTo ? { ...s, status: "idle" } : s,
        ),
        chaosLevel: newChaos,
        score: newScore,
        streak: newStreak,
        totalCompleted: state.totalCompleted + (outcome === "success" ? 1 : 0),
      };
    }),

  addDialogue: (line) =>
    set((state) => ({
      dialogueLog: [line, ...state.dialogueLog].slice(0, 8),
    })),

  clearDialogue: () => set({ dialogueLog: [] }),

  setChaosLevel: (level) =>
    set({ chaosLevel: Math.min(100, Math.max(0, level)) }),

  addChaos: (amount) =>
    set((state) => ({
      chaosLevel: Math.min(100, Math.max(0, state.chaosLevel + amount)),
    })),

  setShaking: (shaking) => set({ isShaking: shaking }),

  addFire: (orderId) =>
    set((state) => ({
      activeFires: Array.from(new Set([...state.activeFires, orderId])),
    })),

  removeFire: (orderId) =>
    set((state) => ({
      activeFires: state.activeFires.filter((id) => id !== orderId),
    })),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  addClonedStaff: (staff) =>
    set((state) => ({ staff: [...state.staff, staff] })),

  updateStaffStatus: (staffId, status) =>
    set((state) => ({
      staff: state.staff.map((s) => (s.id === staffId ? { ...s, status } : s)),
    })),

  spawnInitialOrders: () =>
    set({ orders: [generateNewOrder(), generateNewOrder()] }),

  incrementCompleted: () =>
    set((state) => ({ totalCompleted: state.totalCompleted + 1 })),
}));
