"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mic } from "lucide-react";

interface MicOrbProps {
  state: "listening" | "thinking" | "speaking";
  volume?: number;
  onClick?: () => void;
  emotion?: string;
  voice?: string;
}

export default function MicOrb({ 
  state, 
  volume = 0, 
  onClick, 
  emotion = "calm", 
  voice = "Bella" 
}: MicOrbProps) {
  
  // Dynamic color selection function combining state, emotion, and voice
  const getOrbTheme = () => {
    if (state === "thinking") {
      return {
        primary: "from-purple-500 via-fuchsia-600 to-pink-600",
        secondary: "bg-purple-500/20",
        innerGlow: "shadow-[0_0_50px_20px_rgba(168,85,247,0.35)]",
        border: "border-purple-500/30",
        ripple: "rgba(168, 85, 247, 0.4)",
      };
    }

    switch (emotion) {
      case "melancholic":
        return {
          primary: "from-violet-600 via-indigo-700 to-purple-950",
          secondary: "bg-violet-600/15",
          innerGlow: "shadow-[0_0_50px_20px_rgba(139,92,246,0.3)]",
          border: "border-violet-500/20",
          ripple: "rgba(139, 92, 246, 0.3)",
        };
      case "excited":
        return {
          primary: "from-cyan-400 via-pink-500 to-fuchsia-500",
          secondary: "bg-cyan-500/25",
          innerGlow: "shadow-[0_0_60px_25px_rgba(6,182,212,0.45)]",
          border: "border-cyan-400/40",
          ripple: "rgba(6, 182, 212, 0.6)",
        };
      case "reflective":
        return {
          primary: "from-amber-500 via-yellow-600 to-amber-800",
          secondary: "bg-amber-500/20",
          innerGlow: "shadow-[0_0_50px_20px_rgba(245,158,11,0.35)]",
          border: "border-amber-500/30",
          ripple: "rgba(245, 158, 11, 0.4)",
        };
      case "anxious":
        return {
          primary: "from-slate-500 via-indigo-900 to-slate-900",
          secondary: "bg-slate-500/10",
          innerGlow: "shadow-[0_0_40px_15px_rgba(148,163,184,0.2)]",
          border: "border-slate-500/20",
          ripple: "rgba(148, 163, 184, 0.3)",
        };
      case "lonely":
        return {
          primary: "from-neutral-700 via-indigo-950 to-neutral-900",
          secondary: "bg-neutral-600/10",
          innerGlow: "shadow-[0_0_40px_15px_rgba(120,119,198,0.15)]",
          border: "border-neutral-500/20",
          ripple: "rgba(120, 119, 198, 0.2)",
        };
      case "playful":
        return {
          primary: "from-pink-500 via-rose-500 to-yellow-500",
          secondary: "bg-pink-500/20",
          innerGlow: "shadow-[0_0_55px_20px_rgba(236,72,153,0.35)]",
          border: "border-pink-500/30",
          ripple: "rgba(236, 72, 153, 0.45)",
        };
      case "calm":
      default:
        if (voice === "Bella") {
          return {
            primary: "from-violet-500 via-purple-600 to-fuchsia-600",
            secondary: "bg-purple-500/20",
            innerGlow: "shadow-[0_0_50px_20px_rgba(168,85,247,0.35)]",
            border: "border-purple-500/30",
            ripple: "rgba(168, 85, 247, 0.45)",
          };
        } else if (voice === "Rachel") {
          return {
            primary: "from-cyan-400 via-teal-500 to-blue-600",
            secondary: "bg-cyan-500/20",
            innerGlow: "shadow-[0_0_50px_20px_rgba(6,182,212,0.35)]",
            border: "border-cyan-500/30",
            ripple: "rgba(6, 182, 212, 0.45)",
          };
        } else {
          return {
            primary: "from-blue-600 via-indigo-700 to-cyan-700",
            secondary: "bg-blue-600/20",
            innerGlow: "shadow-[0_0_50px_20px_rgba(37,99,235,0.35)]",
            border: "border-blue-500/30",
            ripple: "rgba(37, 99, 235, 0.45)",
          };
        }
    }
  };

  const currentTheme = getOrbTheme();

  // Variations for the inner morphing fluid shapes
  const morphVariants: Variants = {
    listening: {
      borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
      scale: [0.95, 1.05, 0.95],
      rotate: [0, 120, 360],
      transition: {
        duration: emotion === "excited" ? 4 : 8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    thinking: {
      borderRadius: ["30% 70% 40% 60% / 50% 60% 40% 50%", "60% 40% 60% 40% / 40% 60% 50% 60%", "30% 70% 40% 60% / 50% 60% 40% 50%"],
      scale: [0.92, 1.02, 0.92],
      rotate: [360, 180, 0],
      transition: {
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    speaking: {
      borderRadius: ["50% 50% 50% 50%", "45% 55% 48% 52%", "55% 45% 52% 48%", "50% 50% 50% 50%"],
      scale: 1 + volume * 0.28,
      rotate: [0, 90, 180, 270, 360],
      transition: {
        duration: emotion === "excited" ? 1.0 : 1.6,
        repeat: Infinity,
        ease: "linear" as const,
      },
    },
  };

  return (
    <div className="relative flex items-center justify-center select-none echo-orb-wrapper">
      {/* Cinematic Ambient Pulse Rings from Mockup */}
      <div className="pulse-ring" style={{ animationDelay: "0s" }} />
      <div className="pulse-ring" style={{ animationDelay: "2s" }} />
      <div className="pulse-ring" style={{ animationDelay: "4s" }} />

      {/* Outer Glow Halo Ring (Atmospheric pulse & micro glow fluctuations) */}
      <motion.div
        className={`absolute rounded-full w-72 h-72 blur-3xl transition-all duration-1000 -z-10 ${currentTheme.innerGlow}`}
        animate={{
          scale: state === "speaking" ? 1.05 + volume * 0.50 : [1, 1.04, 1],
          opacity: state === "speaking" ? 0.75 + volume * 0.25 : [0.45, 0.65, 0.45], // Micro glow fluctuations sync
        }}
        transition={
          state === "speaking"
            ? { duration: 0.08 }
            : {
                duration: emotion === "excited" ? 2.0 : emotion === "reflective" ? 4.5 : 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Floating Orbital Interactive Container (Step 5: Organic idle breathing cycle) */}
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center cursor-pointer group"
        initial={{ y: 0 }}
        animate={{
          y: state === "speaking" ? 0 : [-4, 4, -4],
          scale: state === "speaking" ? 1 + volume * 0.08 : [1.0, 1.025, 1.0], // Organic idle breathing cycle
        }}
        transition={{
          y: {
            duration: emotion === "excited" ? 3.5 : emotion === "reflective" ? 6.5 : 5.0,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
          scale: state === "speaking"
            ? { duration: 0.08 }
            : {
                duration: emotion === "excited" ? 2.2 : emotion === "reflective" ? 4.5 : 3.5,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }
        }}
      >
        {/* Layer 1: Ambient Orbit Ring (Thick Glowing Edge) */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentTheme.primary} opacity-30 blur-md group-hover:opacity-45 transition-all duration-1000`} />

        {/* Layer 2: Rotating Ring Border */}
        <motion.div
          className={`absolute -inset-[2px] rounded-full bg-gradient-to-r ${currentTheme.primary} -z-10 opacity-70`}
          style={{ padding: "2px" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: state === "thinking" ? 5 : state === "speaking" ? 1.3 : 11,
            repeat: Infinity,
            ease: "linear" as const,
          }}
        />

        {/* Layer 3: Glassmorphic Core */}
        <div className={`absolute inset-[3px] rounded-full bg-[#030303]/75 backdrop-blur-2xl border ${currentTheme.border} transition-colors duration-1000 flex items-center justify-center overflow-hidden z-10`}>
          {/* Layer 4: Morphing Liquid Fluid Core */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${state}-${emotion}-${voice}`}
              className={`absolute inset-4 rounded-full bg-gradient-to-br ${currentTheme.primary} opacity-[0.16] blur-lg`}
              variants={morphVariants}
              animate={state}
            />
          </AnimatePresence>

          {/* Morphing fluid borders for a volumetric liquid glass aesthetic */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`border-${state}-${emotion}-${voice}`}
              className={`absolute inset-8 rounded-full border border-dashed border-white/5 bg-gradient-to-tr ${currentTheme.primary} opacity-[0.08]`}
              animate={{
                rotate: state === "thinking" ? -360 : 360,
                scale: state === "speaking" ? 0.95 + volume * 0.2 : [0.95, 1.02, 0.95],
              }}
              transition={{
                duration: state === "speaking" ? 0.18 : 14,
                repeat: Infinity,
                ease: "linear" as const,
              }}
            />
          </AnimatePresence>

          {/* Subtle Ambient Refraction Glare */}
          <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20" />

          {/* Central Microphone Icon & Pulsing Halo */}
          <div className="relative z-30 flex flex-col items-center justify-center">
            {/* Reactive Inner Glow Ring */}
            <motion.div
              className={`absolute w-16 h-16 rounded-full ${currentTheme.secondary} blur-md`}
              animate={{
                scale: state === "speaking" ? 1.0 + volume * 0.9 : [1, 1.15, 1],
                opacity: state === "listening" ? [0.4, 0.7, 0.4] : 0.6,
              }}
              transition={
                state === "speaking"
                  ? { duration: 0.1 }
                  : {
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }
              }
            />

            {/* Glowing Icon */}
            <motion.div
              animate={{
                scale: state === "speaking" ? 1 + volume * 0.15 : 1,
              }}
              className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] group-hover:scale-110 transition-transform duration-300"
            >
              <Mic className="w-8 h-8 md:w-9 md:h-9" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        {/* Hover/Active Ambient Wave Rings */}
        <AnimatePresence>
          {state === "listening" && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ borderColor: currentTheme.ripple }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" as const }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-white/5"
                style={{ borderColor: currentTheme.ripple }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.45, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, delay: 0.6, repeat: Infinity, ease: "easeOut" as const }}
              />
            </>
          )}
          {state === "speaking" && (
            <motion.div
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: currentTheme.ripple }}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 1.25 + volume * 0.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "easeOut" as const }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
