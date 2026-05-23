"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mic } from "lucide-react";
import OrbParticleField from "./OrbParticleField";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";
import { getPauseParameters } from "@/lib/emotionalPauseEngine";

interface MicOrbProps {
  state: "listening" | "thinking" | "speaking" | "idle" | "reflecting";
  volume?: number;
  onClick?: () => void;
  isDemoMode?: boolean;
}

export default function MicOrb({
  state,
  volume = 0,
  onClick,
  isDemoMode = false
}: MicOrbProps) {
  const { emotion: activeEmotion, activeParams } = useEmotionFlow();

  const pauseParams = getPauseParameters(activeEmotion);
  const isReflecting = state === "reflecting";
  const glowDim = isReflecting ? pauseParams.orbDimmingFactor : 1.0;

  // Unified emotional color mapping - desaturated to a luxurious 65-75% for ultimate dark space elegance
  const baseHue = (activeParams.particleColorRange[0] + activeParams.particleColorRange[1]) / 2;
  
  const primaryGradient = `linear-gradient(135deg, hsl(${activeParams.particleColorRange[0]}, 75%, 52%), hsl(${baseHue}, 70%, 46%), hsl(${activeParams.particleColorRange[1]}, 65%, 40%))`;
  const secondaryBg = `hsla(${baseHue}, 70%, 52%, 0.12)`;
  const borderStyle = `1px solid hsla(${baseHue}, 70%, 50%, ${0.20 * activeParams.orbGlowBrightness * glowDim})`;
  
  // High-fidelity wide volumetric glow falloff (spread is minimized, blur is maximized)
  const shadowGlow = `0 0 110px ${6 * activeParams.orbPulseIntensity}px hsla(${baseHue}, 70%, 50%, ${0.28 * activeParams.orbGlowBrightness * glowDim * (1 + volume * 0.4)})`;
  const rippleColor = `hsla(${baseHue}, 70%, 50%, ${0.30 * activeParams.orbGlowBrightness * glowDim})`;

  // Variations for the inner morphing fluid shapes (slowed down for organic breathing)
  const morphVariants: Variants = {
    listening: {
      borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "60% 40% 55% 45% / 55% 45% 55% 45%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
      scale: [0.96, 1.04, 0.96],
      rotate: [0, 90, 360],
      transition: {
        duration: (activeParams.orbBreathingSpeed / 1000) * 2.4, // Breathing speed scales dynamic fluid wave rate
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    reflecting: {
      borderRadius: ["50% 50% 50% 50%", "48% 52% 48% 52%", "50% 50% 50% 50%"],
      scale: [0.94, 0.97, 0.94], // Shrinks slightly to look focused
      rotate: [0, 30, 0],
      transition: {
        duration: (activeParams.orbBreathingSpeed / 1000) * pauseParams.breathSlowFactor, // Meditative breathing duration
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    thinking: {
      borderRadius: ["35% 65% 45% 55% / 45% 55% 45% 55%", "55% 45% 55% 45% / 45% 55% 50% 50%", "35% 65% 45% 55% / 45% 55% 45% 55%"],
      scale: [0.94, 1.01, 0.94],
      rotate: [360, 180, 0],
      transition: {
        duration: 4.8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    speaking: {
      borderRadius: ["50% 50% 50% 50%", "47% 53% 49% 51%", "53% 47% 51% 49%", "50% 50% 50% 50%"],
      scale: 1 + volume * 0.22,
      rotate: [0, 90, 180, 270, 360],
      transition: {
        duration: (activeParams.orbBreathingSpeed / 1000) * 0.35,
        repeat: Infinity,
        ease: "linear" as const,
      },
    },
  };

  return (
    <div className="relative flex items-center justify-center select-none echo-orb-wrapper">
      {/* Ambient Particle swarm centered exclusively around the Orb core */}
      <div className="absolute w-[560px] h-[560px] pointer-events-none -z-20 flex items-center justify-center">
        <OrbParticleField state={state} volume={volume} />
      </div>

      {/* Cinematic Ambient Pulse Rings (Very faint, purely atmospheric) */}
      <div className="pulse-ring opacity-15" style={{ animationDelay: "0s", borderColor: rippleColor }} />
      <div className="pulse-ring opacity-10" style={{ animationDelay: "3.5s", borderColor: rippleColor }} />

      {/* Volumetric Soft Glow Falloff Halo */}
      <motion.div
        className="absolute rounded-full w-64 h-64 blur-[96px] transition-all duration-1000 -z-10"
        style={{ boxShadow: shadowGlow }}
        animate={{
          scale: state === "speaking" ? 1.04 + volume * 0.40 : [1, 1.03, 1],
          opacity: state === "speaking" ? 0.65 + volume * 0.20 : [0.40, 0.55, 0.40],
        }}
        transition={
          state === "speaking"
            ? { duration: 0.08 }
            : {
                duration: (activeParams.orbBreathingSpeed / 1000) * 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Floating Organic Core Container */}
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="relative w-52 h-52 md:w-60 md:h-60 rounded-full flex items-center justify-center cursor-pointer group"
        initial={{ y: 0 }}
        animate={{
          y: state === "speaking" ? 0 : isDemoMode ? [-6, 6, -6] : isReflecting ? [-1.2, 1.2, -1.2] : [-3, 3, -3],
          scale: state === "speaking" ? 1 + volume * 0.06 : isDemoMode ? [1.0, 1.035, 1.0] : isReflecting ? [0.96, 0.98, 0.96] : [1.0, 1.015, 1.0], // Highly steady natural respiration
        }}
        transition={{
          y: {
            duration: isReflecting ? (activeParams.orbBreathingSpeed / 1000) * pauseParams.breathSlowFactor : isDemoMode ? 12.0 : (activeParams.orbBreathingSpeed / 1000) * 2.2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
          scale: state === "speaking"
            ? { duration: 0.08 }
            : {
                duration: isReflecting ? (activeParams.orbBreathingSpeed / 1000) * pauseParams.breathSlowFactor : isDemoMode ? 8.0 : (activeParams.orbBreathingSpeed / 1000) * 1.5,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }
        }}
      >
        {/* Layer 1: Ambient Orbit Ring (Thick Glowing Edge) */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-md group-hover:opacity-30 transition-all duration-1000"
          style={{ background: primaryGradient }}
        />

        {/* Layer 2: Rotating Ring Border */}
        <motion.div
          className="absolute -inset-[1.5px] rounded-full -z-10 opacity-40"
          style={{ padding: "1.5px", background: primaryGradient }}
          animate={{ rotate: 360 }}
          transition={{
            duration: state === "thinking" ? 8 : state === "speaking" ? 1.8 : 16,
            repeat: Infinity,
            ease: "linear" as const,
          }}
        />

        {/* Layer 3: Glassmorphic Core */}
        <div 
          className="absolute inset-[2.5px] rounded-full bg-[#020204]/90 backdrop-blur-3xl transition-colors duration-1000 flex items-center justify-center overflow-hidden z-10"
          style={{ border: borderStyle }}
        >
          {/* Layer 4: Morphing Liquid Fluid Core */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${state}-${activeEmotion}`}
              className="absolute inset-4 rounded-full opacity-[0.10] blur-md"
              style={{ background: primaryGradient }}
              variants={morphVariants}
              animate={state}
            />
          </AnimatePresence>

          {/* Morphing fluid borders for a volumetric liquid glass aesthetic */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`border-${state}-${activeEmotion}`}
              className="absolute inset-8 rounded-full border border-dashed border-white/5 opacity-[0.05]"
              style={{ background: primaryGradient }}
              animate={{
                rotate: state === "thinking" ? -360 : 360,
                scale: state === "speaking" ? 0.96 + volume * 0.15 : [0.96, 1.01, 0.96],
              }}
              transition={{
                duration: state === "speaking" ? 0.22 : 18,
                repeat: Infinity,
                ease: "linear" as const,
              }}
            />
          </AnimatePresence>

          {/* Subtle Refraction Glare */}
          <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20" />

          {/* Central Microphone Icon & Pulsing Halo */}
          <div className="relative z-30 flex flex-col items-center justify-center">
            {/* Reactive Inner Glow Ring */}
            <motion.div
              className="absolute w-14 h-14 rounded-full blur-md"
              style={{ background: secondaryBg }}
              animate={{
                scale: state === "speaking" ? 1.0 + volume * 0.6 : [1, 1.10, 1],
                opacity: state === "listening" ? [0.3, 0.5, 0.3] : 0.4,
              }}
              transition={
                state === "speaking"
                  ? { duration: 0.1 }
                  : {
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }
              }
            />

            {/* Glowing Icon */}
            <motion.div
              animate={{
                scale: state === "speaking" ? 1 + volume * 0.10 : 1,
              }}
              className="text-white opacity-70 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Mic className="w-7 h-7 md:w-8 md:h-8 text-neutral-300" strokeWidth={1.2} />
            </motion.div>
          </div>
        </div>

        {/* Dynamic Wave Rings on active voice states */}
        <AnimatePresence>
          {state === "listening" && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border opacity-50"
                style={{ borderColor: rippleColor }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.25, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" as const }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border opacity-30"
                style={{ borderColor: rippleColor }}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.38, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, ease: "easeOut" as const }}
              />
            </>
          )}
          {state === "speaking" && (
            <motion.div
              className="absolute inset-0 rounded-full border opacity-60"
              style={{ borderColor: rippleColor }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.18 + volume * 0.3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" as const }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
