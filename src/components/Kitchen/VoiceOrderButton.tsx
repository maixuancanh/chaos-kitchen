"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface VoiceOrderButtonProps {
  /** Called with the transcribed dish name when STT succeeds */
  onOrderCreated: (dishName: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "requesting" | "recording" | "processing" | "error";

/** Pick the best supported MIME type for MediaRecorder on this browser/OS */
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ""; // browser default
}

export default function VoiceOrderButton({
  onOrderCreated,
  disabled = false,
}: VoiceOrderButtonProps) {
  const [state,       setState]       = useState<RecordingState>("idle");
  const [seconds,     setSeconds]     = useState(0);
  const [transcript,  setTranscript]  = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = useCallback(async () => {
    if (disabled || state !== "idle") return;

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not supported in this browser.");
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopStream();
        if (timerRef.current) clearInterval(timerRef.current);
        setSeconds(0);

        if (chunksRef.current.length === 0) {
          setState("idle");
          return;
        }

        setState("processing");
        setTranscript(null);

        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        try {
          const formData = new FormData();
          formData.append("audio", blob, "order.webm");

          const res = await fetch("/api/stt", { method: "POST", body: formData });
          const json = await res.json();

          if (!res.ok) {
            throw new Error(json.details ?? json.error ?? `HTTP ${res.status}`);
          }

          const text: string = (json.text ?? "").trim();
          if (!text) {
            toast.error("Couldn't hear anything — please try again.");
            setState("idle");
            return;
          }

          // Extract a clean dish name (first 60 chars, strip leading filler phrases)
          const cleaned = text
            .replace(/^(i('d like to order|want|need)\s+)?((a|an|the)\s+)?/i, "")
            .replace(/\.$/, "")
            .trim();

          const dishName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          dishName.slice(0, 60);

          setTranscript(dishName);
          toast.success(`🎙️ Order heard: "${dishName}"`);
          onOrderCreated(dishName.slice(0, 60));

          setTimeout(() => {
            setState("idle");
            setTranscript(null);
          }, 2500);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Transcription failed";
          console.error("[STT]", msg);
          toast.error(`STT error: ${msg}`);
          setState("idle");
        }
      };

      recorder.start(250); // collect data every 250 ms for lower latency
      setState("recording");

      // Elapsed-time counter
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

      // Auto-stop after 15 s so mobile users can't forget to stop
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 15_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone denied";
      console.error("[VoiceOrder]", msg);
      toast.error("Microphone access denied. Check your browser settings.");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [disabled, state, onOrderCreated]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Colours and labels per state
  const cfg = {
    idle:       { bg: "bg-purple-700 hover:bg-purple-600", border: "border-purple-400", label: "🎤 Voice Order", pulse: false },
    requesting: { bg: "bg-yellow-700",                     border: "border-yellow-400", label: "⏳ Requesting mic…", pulse: false },
    recording:  { bg: "bg-red-600 hover:bg-red-500",       border: "border-red-300",    label: `🔴 Recording ${seconds}s — tap to stop`, pulse: true },
    processing: { bg: "bg-blue-700",                       border: "border-blue-400",   label: "🔄 Transcribing…", pulse: false },
    error:      { bg: "bg-gray-700",                       border: "border-gray-500",   label: "❌ Error — try again", pulse: false },
  }[state];

  const handleClick = state === "recording" ? stopRecording : startRecording;

  return (
    <div className="w-full">
      <motion.button
        onClick={handleClick}
        disabled={disabled || state === "requesting" || state === "processing"}
        className={`w-full py-2.5 font-display text-lg rounded-xl border-2 transition-colors ${cfg.bg} ${cfg.border} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={state === "idle" ? { scale: 1.02 } : {}}
        whileTap={state === "idle" || state === "recording" ? { scale: 0.97 } : {}}
        animate={cfg.pulse ? { boxShadow: ["0 0 0px #ef4444", "0 0 18px #ef4444", "0 0 0px #ef4444"] } : {}}
        transition={cfg.pulse ? { duration: 1, repeat: Infinity } : {}}
      >
        <div className="flex items-center justify-center gap-2">
          {state === "recording" && (
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-red-300"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
          {state === "processing" && (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              ⚙️
            </motion.span>
          )}
          <span className="truncate">{cfg.label}</span>
        </div>
      </motion.button>

      {/* Waveform bars while recording */}
      <AnimatePresence>
        {state === "recording" && (
          <motion.div
            className="flex items-end justify-center gap-[3px] mt-2 h-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-red-400 rounded-full"
                animate={{ height: [`${4 + (i % 3) * 4}px`, `${8 + (i % 5) * 6}px`, `${4 + (i % 3) * 4}px`] }}
                transition={{ duration: 0.4 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript preview */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            className="mt-2 bg-purple-950/60 border border-purple-700 rounded-xl px-3 py-2 text-xs text-purple-200"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-purple-400 font-semibold">Heard: </span>
            <span className="italic">"{transcript}"</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile hint */}
      {state === "idle" && (
        <p className="text-xs text-gray-600 text-center mt-1">
          Speak your order — powered by ElevenLabs STT
        </p>
      )}
      {state === "recording" && (
        <p className="text-xs text-yellow-500 text-center mt-1">
          Auto-stops after 15 s
        </p>
      )}
    </div>
  );
}
