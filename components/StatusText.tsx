"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";

interface StatusTextProps {
  state: "listening" | "thinking" | "speaking" | "idle" | "reflecting";
}

export default function StatusText({ state }: StatusTextProps) {
  const { emotion: activeEmotion, activeParams } = useEmotionFlow();

  // Custom styled descriptions for each state depending on the active emotion
  const getSubtitles = () => {
    if (state === "reflecting") {
      switch (activeEmotion) {
        case "melancholic": return "Absorbing the silence with you...";
        case "excited": return "Syncing with your bright energy...";
        case "reflective": return "Contemplating the quiet spaces...";
        case "anxious": return "Breathing into the stillness...";
        case "lonely": return "Feeling the warm space between us...";
        case "playful": return "Holding a spark of thought...";
        case "calm":
        default: return "Absorbing the quiet moment...";
      }
    }

    if (state === "thinking") {
      switch (activeEmotion) {
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
      switch (activeEmotion) {
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
    switch (activeEmotion) {
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

  const currentSubtitle = getSubtitles();
  const subtitleDuration = activeParams.uiSubtitleFadeMs / 1000;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none min-h-[30px] px-6">
      {/* Narrative Interactive Subtitle (Cinematic, dim, Blade Runner style) */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`subtitle-${state}-${activeEmotion}`}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 0.55, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: subtitleDuration, ease: "easeInOut" }}
          className="text-[9px] md:text-[10px] font-light text-neutral-400 tracking-[0.25em] uppercase text-center max-w-sm"
        >
          {currentSubtitle}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
