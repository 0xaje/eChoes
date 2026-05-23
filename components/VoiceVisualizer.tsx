"use client";

import { motion, TargetAndTransition } from "framer-motion";
import { useEffect, useState } from "react";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";

interface VoiceVisualizerProps {
  state: "listening" | "thinking" | "speaking" | "idle" | "reflecting";
  audioLevels?: number[];
  averageAmplitude?: number;
}

export default function VoiceVisualizer({
  state,
  audioLevels,
  averageAmplitude = 0,
}: VoiceVisualizerProps) {
  const [barsCount] = useState(24);
  const [windowLoaded, setWindowLoaded] = useState(false);
  const { activeParams } = useEmotionFlow();

  useEffect(() => {
    setWindowLoaded(true);
  }, []);

  // Compute dynamic color waves derived dynamically from lerped HSL ranges
  const baseHue = (activeParams.particleColorRange[0] + activeParams.particleColorRange[1]) / 2;
  const waveColors = [
    `hsl(${activeParams.particleColorRange[0]}, 85%, 55%)`,
    `hsl(${activeParams.particleColorRange[1]}, 80%, 45%)`
  ];

  const barGlow = {
    bg: `linear-gradient(to top, hsla(${activeParams.particleColorRange[0]}, 85%, 35%, 0.2), hsl(${activeParams.particleColorRange[1]}, 85%, 65%))`,
    shadow: `0 0 ${8 * activeParams.orbPulseIntensity}px hsl(${activeParams.particleColorRange[1]}, 85%, 65%)`
  };

  const bars = Array.from({ length: barsCount }, (_, i) => i);

  // Return specific animation parameters for each state per bar index
  const getBarAnimation = (index: number): TargetAndTransition => {
    const midPoint = barsCount / 2;
    const distanceToCenter = Math.abs(index - midPoint);
    const centerFactor = Math.max(0.1, 1 - distanceToCenter / (barsCount * 0.6));

    // Dynamic pace speed linked directly to active emotion flow
    const durationMultiplier = activeParams.orbBreathingSpeed / 3000;

    switch (state) {
      case "listening":
        // Cinematic idle resting breathing wave (Step 5)
        return {
          height: [
            `${4 + Math.sin(index * 0.35) * 2.5}px`,
            `${8 + Math.sin(index * 0.35 + Math.PI / 2) * 3.5}px`,
            `${4 + Math.sin(index * 0.35) * 2.5}px`,
          ],
          transition: {
            duration: (2.0 + (index % 3) * 0.2) * durationMultiplier,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: index * 0.04,
          },
        };
      case "reflecting":
        // Quiet, flatline meditative resting state during silence
        return {
          height: ["2px", "4px", "2px"],
          transition: {
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: index * 0.08,
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
            duration: 1.8 * durationMultiplier,
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
            duration: (0.45 + Math.random() * 0.45) * durationMultiplier,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: (index % 3) * 0.07,
          },
        };
      default:
        return { height: "4px" };
    }
  };

  return (
    <div className="relative w-full max-w-lg flex flex-col items-center justify-center py-6 px-4">
      {/* Dynamic Glow Layer Behind Visualizer */}
      <div 
        className="absolute inset-0 blur-xl h-24 transition-colors duration-1000 opacity-[--ui-glow-opacity]"
        style={{
          background: `radial-gradient(circle, hsla(${baseHue}, 85%, 55%, 0.08) 0%, transparent 70%)`
        }}
      />

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
              duration: state === "speaking" ? 0.2 : (activeParams.orbBreathingSpeed / 1000) * 1.5,
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
              duration: state === "speaking" ? 0.25 : (activeParams.orbBreathingSpeed / 1000) * 2.2,
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

            return (
              <motion.div
                key={index}
                className="w-[2.5px] min-h-[4px] rounded-[1px]"
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
