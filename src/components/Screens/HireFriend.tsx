"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useGameStore } from "@/store/gameStore";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

export default function HireFriend() {
  const { setPhase, addClonedStaff } = useGameStore((s) => ({
    setPhase: s.setPhase,
    addClonedStaff: s.addClonedStaff,
  }));

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [friendName, setFriendName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setAudioFile(acceptedFiles[0]);
      toast.success(`Loaded: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".webm"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleClone = async () => {
    if (!audioFile || !friendName.trim()) {
      toast.error("Please enter a name and upload a voice recording!");
      return;
    }
    setIsCloning(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("name", friendName.trim());

      const response = await fetch("/api/voice-clone", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.details || data.error || "Cloning failed");

      addClonedStaff({
        id: uuidv4(),
        name: friendName.trim(),
        role: "cloned",
        voiceId: data.voiceId,
        personality: "Your friend forced into kitchen duty",
        emoji: "😂",
        successRate: 0.5,
        isCloned: true,
        status: "idle",
      });

      setCloneSuccess(true);
      toast.success(`🎉 ${friendName} has been hired!`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error: ${msg}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at center, #1a0030 0%, #1a0a00 70%)",
      }}
    >
      <motion.div
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🎙️</div>
          <h1 className="font-display text-6xl text-purple-400">
            HIRE A FRIEND
          </h1>
          <p className="text-orange-200 mt-2">
            Clone your friend's voice and let them cause disasters in your
            kitchen!
          </p>
        </div>

        <div className="bg-kitchen-surface rounded-2xl p-6 border border-purple-800 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-orange-300 font-semibold mb-2">
              Friend's name:
            </label>
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="e.g. Alex, Sam, Jordan..."
              className="w-full bg-kitchen-bg border border-orange-900 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-orange-300 font-semibold mb-2">
              Voice recording (~30 seconds):
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-400 bg-purple-900/20"
                  : "border-orange-800 hover:border-orange-500"
              }`}
            >
              <input {...getInputProps()} />
              {audioFile ? (
                <div>
                  <div className="text-4xl mb-2">🎵</div>
                  <p className="text-green-400 font-semibold">
                    {audioFile.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-orange-200">
                    {isDragActive
                      ? "Drop file here!"
                      : "Drag & drop or click to select audio"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    MP3, WAV, M4A (max 10 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clone button */}
          <motion.button
            onClick={handleClone}
            disabled={isCloning || !audioFile || !friendName || cloneSuccess}
            className={`w-full py-4 font-display text-3xl rounded-xl border-2 transition-colors ${
              cloneSuccess
                ? "bg-green-700 border-green-400 text-white"
                : isCloning
                  ? "bg-purple-900 border-purple-600 text-purple-300 cursor-wait"
                  : "bg-purple-600 hover:bg-purple-500 border-purple-400 text-white"
            }`}
            whileHover={!isCloning && !cloneSuccess ? { scale: 1.02 } : {}}
            whileTap={!isCloning && !cloneSuccess ? { scale: 0.98 } : {}}
          >
            {cloneSuccess
              ? "✅ HIRED!"
              : isCloning
                ? "⏳ CLONING..."
                : "🎙️ CLONE VOICE"}
          </motion.button>

          {/* Tips */}
          <div className="bg-purple-900/30 rounded-xl p-4 text-sm text-purple-200 space-y-1">
            <p className="font-semibold text-purple-300">
              💡 Tips for best results:
            </p>
            <p>• Record in a quiet room</p>
            <p>• Speak naturally with varied tone and sentences</p>
            <p>• At least 30 seconds of audio</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <motion.button
            onClick={() => setPhase("menu")}
            className="flex-1 py-3 bg-kitchen-surface border border-orange-900 font-display text-2xl rounded-xl hover:border-orange-500 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← BACK
          </motion.button>
          {cloneSuccess && (
            <motion.button
              onClick={() => useGameStore.getState().startGame()}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 font-display text-2xl rounded-xl border-2 border-orange-300 transition-colors"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🍳 START COOKING!
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
