"use client";

import { motion, TargetAndTransition } from "framer-motion";
import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  state: "listening" | "thinking" | "speaking";
  audioLevels?: number[];
  averageAmplitude?: number;
  emotion?: string;
  voice?: string;
}

export default function VoiceVisualizer({ 
  state, 
  audioLevels, 
  averageAmplitude = 0, 
  emotion = "calm", 
  voice = "Bella" 
}: VoiceVisualizerProps) {
  const [barsCount] = useState(24);
  const [windowLoaded, setWindowLoaded] = useState(false);

  useEffect(() => {
    setWindowLoaded(true);
  }, []);

  // Map state and emotion to spectacular glowing bar styling
  const getBarColor = () => {
    if (state === "thinking") {
      return "bg-purple-500/70 shadow-[0_0_10px_rgba(168,85,247,0.5)]";
    }

    switch (emotion) {
      case "melancholic":
        return "bg-violet-600/70 shadow-[0_0_12px_rgba(139,92,246,0.5)]";
      case "excited":
        return "bg-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.7)]";
      case "reflective":
        return "bg-amber-400/75 shadow-[0_0_12px_rgba(245,158,11,0.55)]";
      case "anxious":
        return "bg-slate-400/60 shadow-[0_0_10px_rgba(148,163,184,0.4)]";
      case "lonely":
        return "bg-neutral-500/50 shadow-[0_0_8px_rgba(163,163,163,0.3)]";
      case "playful":
        return "bg-rose-400/80 shadow-[0_0_14px_rgba(251,113,133,0.65)]";
      case "calm":
      default:
        if (voice === "Bella") {
          return "bg-purple-500/75 shadow-[0_0_12px_rgba(168,85,247,0.55)]";
        } else if (voice === "Rachel") {
          return "bg-cyan-500/75 shadow-[0_0_12px_rgba(6,182,212,0.55)]";
        } else {
          return "bg-blue-500/75 shadow-[0_0_12px_rgba(59,130,246,0.55)]";
        }
    }
  };

  const getWaveColor = () => {
    if (state === "thinking") return ["#a855f7", "#e879f9"];

    switch (emotion) {
      case "melancholic": return ["#8b5cf6", "#4f46e5"];
      case "excited": return ["#06b6d4", "#ec4899"];
      case "reflective": return ["#f59e0b", "#d97706"];
      case "anxious": return ["#94a3b8", "#64748b"];
      case "lonely": return ["#6b7280", "#4b5563"];
      case "playful": return ["#fb7185", "#fbbf24"];
      case "calm":
      default:
        if (voice === "Bella") return ["#a855f7", "#c084fc"];
        if (voice === "Rachel") return ["#06b6d4", "#0ea5e9"];
        return ["#3b82f6", "#2563eb"];
    }
  };

  const currentBarColor = getBarColor();
  const waveColors = getWaveColor();

  const bars = Array.from({ length: barsCount }, (_, i) => i);

  // Return specific animation parameters for each state per bar index
  const getBarAnimation = (index: number): TargetAndTransition => {
    const midPoint = barsCount / 2;
    const distanceToCenter = Math.abs(index - midPoint);
    const centerFactor = Math.max(0.1, 1 - distanceToCenter / (barsCount * 0.6));

    // Slow pacing multipliers based on emotional energy
    const speedFactor = emotion === "excited" ? 0.65 : emotion === "melancholic" ? 1.6 : 1.0;

    switch (state) {
      case "listening":
        // Cinematic idle resting breathing wave (Step 5)
        // Propagates a gorgeous slowly breathing sine-wave drift when silent
        return {
          height: [
            `${4 + Math.sin(index * 0.35) * 2.5}px`,
            `${8 + Math.sin(index * 0.35 + Math.PI / 2) * 3.5}px`,
            `${4 + Math.sin(index * 0.35) * 2.5}px`,
          ],
          transition: {
            duration: (2.0 + (index % 3) * 0.2) * speedFactor,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: index * 0.04,
          },
        };
      case "thinking":
        return {
          height: [
            `${8 + Math.sin(index * 0.4) * 8}px`,
            `${8 + Math.sin(index * 0.4 + Math.PI) * 8}px`,
            `${8 + Math.sin(index * 0.4) * 8}px`,
          ],
          transition: {
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: index * 0.04,
          },
        };
      case "speaking":
        return {
          height: [
            "6px",
            `${20 + Math.random() * 64 * centerFactor}px`,
            "6px",
          ],
          transition: {
            duration: 0.45 + Math.random() * 0.45,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: (index % 3) * 0.07,
          },
        };
      default:
        return { height: "6px" };
    }
  };

  return (
    <div className="relative w-full max-w-lg flex flex-col items-center justify-center py-6 px-4">
      {/* Dynamic Glow Layer Behind Visualizer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent blur-xl h-24" />

      {/* Layer 1: Ambient Siri-style fluid wavy paths behind the bars */}
      <div className="absolute w-full h-16 opacity-30 select-none pointer-events-none z-0">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Wave 1 */}
          <motion.path
            d="M0 50 Q 25 25, 50 50 T 100 50"
            fill="none"
            stroke={waveColors[0]}
            strokeWidth="0.5"
            animate={
              state === "speaking"
                ? {
                    d: [
                      `M0 50 Q 25 ${30 - averageAmplitude * 20}, 50 ${60 + averageAmplitude * 15} T 100 50`,
                      `M0 50 Q 25 ${70 + averageAmplitude * 15}, 50 ${20 - averageAmplitude * 20} T 100 50`,
                      `M0 50 Q 25 ${30 - averageAmplitude * 20}, 50 ${60 + averageAmplitude * 15} T 100 50`,
                    ],
                    opacity: 0.2 + averageAmplitude * 0.7,
                  }
                : state === "thinking"
                ? {
                    d: [
                      "M0 50 Q 25 40, 50 60 T 100 50",
                      "M0 50 Q 25 60, 50 40 T 100 50",
                      "M0 50 Q 25 40, 50 60 T 100 50",
                    ],
                    opacity: 0.3,
                  }
                : {
                    // Drifting slow ambient wave during silence
                    d: [
                      "M0 50 Q 25 44, 50 56 T 100 50",
                      "M0 50 Q 25 56, 50 44 T 100 50",
                      "M0 50 Q 25 44, 50 56 T 100 50",
                    ],
                    opacity: 0.25,
                  }
            }
            transition={{
              duration: state === "speaking" ? 0.2 : emotion === "excited" ? 2.5 : 4.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />

          {/* Wave 2 */}
          <motion.path
            d="M0 50 Q 25 65, 50 35 T 100 50"
            fill="none"
            stroke={waveColors[1]}
            strokeWidth="0.3"
            animate={
              state === "speaking"
                ? {
                    d: [
                      `M0 50 Q 25 ${70 + averageAmplitude * 15}, 50 ${25 - averageAmplitude * 15} T 100 50`,
                      `M0 50 Q 25 ${15 - averageAmplitude * 15}, 50 ${75 + averageAmplitude * 15} T 100 50`,
                      `M0 50 Q 25 ${70 + averageAmplitude * 15}, 50 ${25 - averageAmplitude * 15} T 100 50`,
                    ],
                    opacity: 0.15 + averageAmplitude * 0.6,
                  }
                : {
                    d: [
                      "M0 50 Q 25 54, 50 46 T 100 50",
                      "M0 50 Q 25 46, 50 54 T 100 50",
                      "M0 50 Q 25 54, 50 46 T 100 50",
                    ],
                    opacity: 0.15,
                  }
            }
            transition={{
              duration: state === "speaking" ? 0.25 : emotion === "excited" ? 4 : 7,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />
        </svg>
      </div>

      {/* Layer 2: Main Rounded Glow Bars */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-sm h-24 px-6">
        {windowLoaded &&
          bars.map((index) => {
            const isSpeakingState = state === "speaking";
            const realHeight = isSpeakingState && audioLevels 
              ? `${4 + (audioLevels[index] || 0) * 0.85}px` 
              : undefined;

            const barGlow = (() => {
              if (state === "thinking") {
                return { bg: "linear-gradient(to top, rgba(168, 85, 247, 0.2), #e879f9)", shadow: "0 0 8px #e879f9" };
              }
              switch (emotion) {
                case "melancholic":
                  return { bg: "linear-gradient(to top, rgba(139, 92, 246, 0.2), #a78bfa)", shadow: "0 0 8px #a78bfa" };
                case "excited":
                  return { bg: "linear-gradient(to top, rgba(6, 182, 212, 0.2), #f472b6)", shadow: "0 0 10px #f472b6" };
                case "reflective":
                  return { bg: "linear-gradient(to top, rgba(245, 158, 11, 0.2), #fbbf24)", shadow: "0 0 8px #fbbf24" };
                case "anxious":
                  return { bg: "linear-gradient(to top, rgba(148, 163, 184, 0.2), #94a3b8)", shadow: "0 0 6px #94a3b8" };
                case "lonely":
                  return { bg: "linear-gradient(to top, rgba(163, 163, 163, 0.15), #a3a3a3)", shadow: "0 0 6px #a3a3a3" };
                case "playful":
                  return { bg: "linear-gradient(to top, rgba(251, 113, 133, 0.2), #fb7185)", shadow: "0 0 10px #fb7185" };
                case "calm":
                default:
                  if (voice === "Bella") {
                    return { bg: "linear-gradient(to top, rgba(168, 85, 247, 0.2), #c084fc)", shadow: "0 0 8px #c084fc" };
                  } else if (voice === "Rachel") {
                    return { bg: "linear-gradient(to top, rgba(0, 241, 253, 0.2), #00f1fd)", shadow: "0 0 10px #00f1fd" };
                  } else {
                    return { bg: "linear-gradient(to top, rgba(59, 130, 246, 0.2), #60a5fa)", shadow: "0 0 8px #60a5fa" };
                  }
              }
            })();

            return (
              <motion.div
                key={index}
                className="w-[2.5px] min-h-[4px] rounded-[1px] transition-all duration-1000"
                animate={realHeight ? { height: realHeight } : getBarAnimation(index)}
                transition={realHeight ? { type: "spring", stiffness: 350, damping: 25 } : undefined}
                style={{ 
                  originY: 0.5, 
                  background: barGlow.bg,
                  boxShadow: barGlow.shadow 
                }}
              />
            );
          })}
      </div>
    </div>
  );
}
