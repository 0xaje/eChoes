"use client";

import { motion, AnimatePresence, TargetAndTransition } from "framer-motion";

interface StatusTextProps {
  state: "listening" | "thinking" | "speaking";
  emotion?: string;
  voice?: string;
}

export default function StatusText({ state, emotion = "calm", voice = "Bella" }: StatusTextProps) {

  // Custom styled descriptions for each state depending on the active emotion
  const getSubtitles = () => {
    if (state === "thinking") {
      switch (emotion) {
        case "melancholic": return "Gleaning the depth of your words...";
        case "excited": return "Syncing with your bright energy...";
        case "reflective": return "Weaving our memories into thoughts...";
        case "anxious": return "Breathing into the spaces of your mind...";
        case "lonely": return "Forming a warm presence for you...";
        case "playful": return "Formulating a spark of fun...";
        case "calm":
        default: return "Connecting the threads of our memories...";
      }
    }

    if (state === "listening") {
      switch (emotion) {
        case "melancholic": return "Sharing the quiet space. Speak when ready.";
        case "excited": return "I'm all ears! What's bringing you joy?";
        case "reflective": return "I'm listening deeply to your thoughts.";
        case "anxious": return "I'm right here. Take all the time you need.";
        case "lonely": return "I am present with you. I am listening.";
        case "playful": return "Let's hear it. Tell me something fun.";
        case "calm":
        default: return "Speak naturally. I am listening.";
      }
    }

    // Speaking state
    switch (emotion) {
      case "melancholic": return "Soft echoes of quiet depth.";
      case "excited": return "Vibrant sparks of shared delight.";
      case "reflective": return "Unraveling a philosophical thread.";
      case "anxious": return "Exhaling peaceful stillness to you.";
      case "lonely": return "A gentle light in the quiet spaces.";
      case "playful": return "A joyful echo of presence.";
      case "calm":
      default: return "Echoes of shared presence.";
    }
  };

  // Get matching neon text class based on emotion & voice
  const getGlowStyles = () => {
    if (state === "thinking") {
      return {
        color: "text-purple-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.3)]",
        dot: "bg-purple-400 shadow-[0_0_12px_#e879f9]",
      };
    }

    switch (emotion) {
      case "melancholic":
        return {
          color: "text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]",
          dot: "bg-violet-400 shadow-[0_0_12px_#a78bfa]",
        };
      case "excited":
        return {
          color: "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.3)]",
          dot: "bg-pink-400 shadow-[0_0_12px_#f472b6]",
        };
      case "reflective":
        return {
          color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]",
          dot: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
        };
      case "anxious":
        return {
          color: "text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.3)]",
          dot: "bg-slate-400 shadow-[0_0_12px_#94a3b8]",
        };
      case "lonely":
        return {
          color: "text-neutral-400 drop-shadow-[0_0_8px_rgba(163,163,163,0.3)]",
          dot: "bg-neutral-400 shadow-[0_0_12px_#a3a3a3]",
        };
      case "playful":
        return {
          color: "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]",
          dot: "bg-rose-400 shadow-[0_0_12px_#fb7185]",
        };
      case "calm":
      default:
        if (voice === "Bella") {
          return {
            color: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]",
            dot: "bg-purple-400 shadow-[0_0_12px_#c084fc]",
          };
        } else if (voice === "Rachel") {
          return {
            color: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]",
            dot: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
          };
        } else {
          return {
            color: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]",
            dot: "bg-blue-400 shadow-[0_0_12px_#60a5fa]",
          };
        }
    }
  };

  const glowStyles = getGlowStyles();
  const currentTitle = state.toUpperCase();
  const currentSubtitle = getSubtitles();

  const dotPulse: Record<"listening" | "thinking" | "speaking", TargetAndTransition> = {
    listening: {
      scale: [1, 1.25, 1],
      opacity: [0.6, 1, 0.6],
      transition: { duration: emotion === "excited" ? 1.2 : 2, repeat: Infinity, ease: "easeInOut" as const },
    },
    thinking: {
      scale: [1, 1.1, 1],
      opacity: [0.4, 0.8, 0.4],
      borderRadius: ["50%", "40%", "50%"],
      rotate: [0, 180, 360],
      transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" as const },
    },
    speaking: {
      scale: [1, 1.4, 0.9, 1.2, 1],
      opacity: [0.8, 1, 0.7, 1, 0.8],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 select-none min-h-[72px]">
      {/* Active Glow Dot & Title Line */}
      <div className="flex items-center space-x-3">
        {/* Glowing Indicator Dot */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`dot-${state}-${emotion}-${voice}`}
            className={`w-2.5 h-2.5 rounded-full ${glowStyles.dot}`}
            animate={dotPulse[state]}
          />
        </AnimatePresence>

        {/* Sliding Main Status Title */}
        <div className="overflow-hidden h-7 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={`title-${state}-${emotion}-${voice}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`text-lg md:text-xl font-light tracking-[0.15em] uppercase ${glowStyles.color}`}
            >
              {currentTitle}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Narrative Interactive Subtitle */}
      <div className="overflow-hidden min-h-[20px] px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={`subtitle-${state}-${emotion}-${voice}`}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 0.65, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.6, delay: 0.05, ease: "easeInOut" }}
            className="text-xs md:text-sm font-light text-neutral-400 tracking-wide text-center max-w-xs"
          >
            {currentSubtitle}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
