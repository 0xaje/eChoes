"use client";

import { motion } from "framer-motion";
import { Video, VideoOff } from "lucide-react";

interface DemoModeToggleProps {
  isDemoMode: boolean;
  onToggle: () => void;
}

export default function DemoModeToggle({ isDemoMode, onToggle }: DemoModeToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={`fixed bottom-4 left-4 z-50 flex items-center space-x-2.5 px-3.5 py-2 rounded-full border backdrop-blur-xl text-[9px] font-semibold uppercase tracking-[0.2em] transition-all duration-700 shadow-2xl ${isDemoMode
          ? "bg-purple-500/20 text-purple-300 border-purple-500/35 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
          : "bg-neutral-900/60 text-neutral-400 border-white/5 hover:bg-neutral-900/80 hover:text-neutral-100"
        }`}
    >
      {isDemoMode ? (
        <>
          <Video className="w-3.5 h-3.5 text-purple-400 animate-pulse" strokeWidth={2.5} />
          <span>Cinematic Demo Mode</span>
        </>
      ) : (
        <>
          <VideoOff className="w-3.5 h-3.5 text-neutral-500" strokeWidth={2} />
          <span>Enable Demo Mode</span>
        </>
      )}
    </motion.button>
  );
}
