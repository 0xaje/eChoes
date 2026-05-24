"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import MicOrb from "@/components/MicOrb";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import StatusText from "@/components/StatusText";
import VoicePersonalityPanel from "@/components/VoicePersonalityPanel";

import SynapticMemoryWeb from "@/components/SynapticMemoryWeb";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import { soundscape } from "@/lib/soundscapeEngine";
import { Sparkles, Radio, Power, Volume2, VolumeX, Activity } from "lucide-react";
import { EmotionFlowProvider, useEmotionFlow } from "@/lib/emotionFlowDirector";

function EchoesDashboard() {
  const { activeParams } = useEmotionFlow();
  const {
    state,
    transcript,
    aiTranscript,
    audioLevels,
    averageAmplitude,
    isEngineActive,
    startEngine,
    stopEngine,
    handleInterruption,
    submitTextInput,
    currentEmotion,
    currentVoice,
    recentMemories,
    updateVoice,
  } = useVoiceEngine();


  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSoundscapeMuted, setIsSoundscapeMuted] = useState(true);

  // Perspective 3D rotation based on mouse coordinates for premium drift depth
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xAxis = (window.innerWidth / 2 - e.clientX) / 45;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 45;
      setMousePos({ x: xAxis, y: yAxis });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Sync ambient Soundscape Engine
  useEffect(() => {
    if (isEngineActive && !isSoundscapeMuted) {
      soundscape?.start();
      soundscape?.updateEmotion(currentEmotion, false);
    } else {
      soundscape?.stop();
    }
  }, [isEngineActive, currentEmotion, isSoundscapeMuted]);

  // Container variants for cinematic reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
    show: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-x-hidden p-4 md:p-8 text-white font-sans selection:bg-cyan-500/20 select-none"
      style={{
        transitionDuration: `${activeParams.uiTransitionSpeed}ms`,
        "--ui-transition-ms": `${activeParams.uiTransitionSpeed}ms`,
        "--ui-glow-opacity": activeParams.uiGlowIntensity,
        "--ui-subtitle-fade": `${activeParams.uiSubtitleFadeMs}ms`
      } as React.CSSProperties}
    >
      
      {/* 1. Ambient Particles & Dynamic Auroras Background */}
      <AnimatedBackground />

      {/* 2. Top Header Navigation */}
      <AnimatePresence>
        <motion.nav
            key="header-nav"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 w-full flex items-center justify-between h-20 px-8 md:px-12 z-50 bg-transparent pointer-events-none"
          >
            {/* Centered Brand Title */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span className="font-light text-[9px] tracking-[0.4em] uppercase text-neutral-400">
                ECHOES
              </span>
            </div>

            {/* Dynamic Connection Indicator */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <AnimatePresence mode="wait">
                {isEngineActive ? (
                  <motion.div
                    key="active-indicator"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md"
                  >
                    <Radio className="w-2.5 h-2.5 text-neutral-300 animate-pulse" />
                    <span className="text-[7.5px] uppercase tracking-widest text-neutral-300 font-medium">
                      LINK ESTABLISHED
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle-indicator"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-neutral-400" />
                    <span className="text-[7.5px] uppercase tracking-widest text-neutral-400 font-medium">
                      STANDBY
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.nav>
      </AnimatePresence>

      {/* 3. Main Center Area */}
      <main className="flex-1 w-full max-w-7xl flex flex-col items-center justify-center relative px-4 md:px-12 py-20 z-30">
        <AnimatePresence mode="wait">
          {!isEngineActive ? (
            /* PRE-CONNECTION CTA PAGE (Soulful Minimalist Entrance) */
            <motion.div
              key="activation-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center max-w-4xl w-full space-y-10 text-center px-4"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-extralight tracking-[0.35em] uppercase bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  ECHOES
                </h1>
                <p className="text-[9px] font-light text-neutral-500 tracking-[0.25em] leading-relaxed uppercase max-w-xs mx-auto">
                  A Single Emotional Presence
                </p>
              </div>

              {/* Dynamic Voice Personality Selector */}
              <div className="w-full py-2">
                <VoicePersonalityPanel
                  currentVoice={currentVoice}
                  onVoiceChange={updateVoice}
                  emotion={currentEmotion}
                />
              </div>

              {/* Launch Action Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={startEngine}
                className="w-full max-w-xs py-3.5 rounded-full bg-white/[0.02] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white font-medium text-[10px] tracking-[0.25em] uppercase hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all duration-500 flex items-center justify-center space-x-3 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5 text-neutral-300" strokeWidth={1.5} />
                <span>Begin Session</span>
              </motion.button>
            </motion.div>
          ) : (
            /* COMPANION SCREEN (Visual Focus centered solely on Orb) */
            <motion.div
              key="companion-screen"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center justify-center relative min-h-[500px]"
            >
              {/* Ghost layer Synaptic memory vector grid behind the Orb */}
              <SynapticMemoryWeb 
                memories={recentMemories} 
                isActive={isEngineActive} 
                isDemoMode={false} 
              />

              {/* Centerpiece 3D Camera drift container */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center transition-all duration-1000 z-20"
                animate={{
                  rotateY: mousePos.x,
                  rotateX: -mousePos.y,
                }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 24
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <MicOrb
                  state={state === "idle" ? "listening" : state}
                  volume={averageAmplitude}
                  onClick={handleInterruption}
                  isDemoMode={false}
                />
              </motion.div>

              {/* Subtle visualizer and status HUD (Unbordered, low opacity) */}
              <motion.div 
                variants={itemVariants} 
                className="mt-12 flex flex-col items-center justify-center w-full z-20"
              >
                {/* Visualizer is placed in background state at 20% opacity */}
                <div className="opacity-20 transition-opacity duration-1000 pointer-events-none mb-3">
                  <VoiceVisualizer
                    state={state === "idle" ? "listening" : state}
                    audioLevels={audioLevels}
                    averageAmplitude={averageAmplitude}
                  />
                </div>
                
                <div className="scale-95">
                  <StatusText
                    state={state === "idle" ? "listening" : state}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Bottom Subtitles and Narrative Area */}
      <footer className="w-full relative px-6 pb-12 z-30 flex flex-col items-center shrink-0">
        <AnimatePresence>
          {isEngineActive && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="w-full max-w-xl px-6 relative mb-6 select-text"
            >
              {/* Pure unbordered cinematic subtitles floating in dark space */}
              <div className="w-full flex justify-center">
                <div className="text-center relative min-h-[72px] flex items-center justify-center w-full select-none">
                  <AnimatePresence mode="wait">
                    {state === "speaking" && aiTranscript.trim() ? (
                      <motion.p
                        key="ai-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        exit={{ opacity: 0 }}
                        className="text-xs md:text-sm font-light text-neutral-300 leading-relaxed tracking-wide max-w-lg"
                      >
                        {aiTranscript.split(" ").map((word, idx) => (
                          <motion.span
                            key={`${word}-${idx}`}
                            initial={{ opacity: 0, filter: "blur(2px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.35, delay: idx * 0.04 }}
                            className="inline-block mr-1 font-sans font-light"
                          >
                            {word}
                          </motion.span>
                        ))}
                      </motion.p>
                    ) : (state === "listening" || state === "reflecting") && transcript.trim() ? (
                      <motion.p
                        key="user-subtitles"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 0.65, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs md:text-sm font-light text-neutral-400 leading-relaxed tracking-wide italic max-w-lg"
                      >
                        &ldquo;{transcript}&rdquo;
                      </motion.p>
                    ) : state === "thinking" ? (
                      <motion.div
                        key="thinking-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.35, 0.65, 0.35] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-[8px] uppercase tracking-[0.25em] text-neutral-500 font-light flex items-center space-x-2 select-none"
                      >
                        <span className="w-1 h-1 rounded-full bg-neutral-500 animate-pulse" />
                        <span>Resonating...</span>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="idle-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.45 }}
                        transition={{ duration: 1.5 }}
                        className="text-[10px] md:text-xs font-light text-neutral-500 leading-relaxed tracking-wider animate-pulse duration-[6000ms] select-none"
                      >
                        &ldquo;I sense a shift in your resonance today. Shall we explore the drift?&rdquo;
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Keyboard Fallback entry field (Sleek minimalist unbordered form) */}
              <div className="mt-4 w-full flex justify-center">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const inputEl = form.elements.namedItem("message") as HTMLInputElement;
                    if (inputEl && inputEl.value.trim()) {
                      submitTextInput(inputEl.value);
                      inputEl.value = "";
                    }
                  }}
                  className="w-full max-w-md flex items-center bg-white/[0.01] border border-white/5 rounded-full px-5 py-1.5 focus-within:border-white/15 focus-within:bg-white/[0.02] transition-all duration-500"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Whisper to the Echo..."
                    className="flex-1 bg-transparent border-0 outline-none text-[10px] font-light text-neutral-400 placeholder-neutral-600 tracking-wider px-2 py-1.5"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-neutral-500 hover:text-white transition-all" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer sub-branding */}
        <div className="text-[7.5px] font-light text-neutral-700 tracking-[0.25em] uppercase flex items-center space-x-2 select-none mt-2">
          <span>Ethereal Presence Active</span>
        </div>
      </footer>

      {/* 5. Floating Bottom-Left Voice Personality Drawer */}
      {isEngineActive && (
        <div className="fixed bottom-6 left-8 md:left-12 z-50 flex flex-col items-start gap-4">
          <AnimatePresence>
            {isVoicePanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-4 rounded-2xl w-[335px] md:w-[350px] max-w-sm mb-2 shadow-2xl relative border border-white/5"
              >
                <VoicePersonalityPanel
                  currentVoice={currentVoice}
                  onVoiceChange={(voice) => {
                    updateVoice(voice);
                    setIsVoicePanelOpen(false);
                  }}
                  emotion={currentEmotion}
                  compact={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsVoicePanelOpen(!isVoicePanelOpen)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-card hover:border-white/15 transition-all cursor-pointer border border-white/5"
          >
            <Radio className="w-3 h-3 text-neutral-400" />
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
              {currentVoice}
            </span>
          </button>
        </div>
      )}

      {/* 6. Floating Bottom-Right Active Mic / Neural Toggle */}
      <div className="fixed bottom-6 right-8 md:right-12 z-50 flex items-center gap-3">
        {/* Mute / Unmute Soundscape */}
        {isEngineActive && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSoundscapeMuted(prev => !prev)}
            className={`w-9 h-9 rounded-full glass-card flex items-center justify-center cursor-pointer transition-all duration-500 border border-white/5 ${
              !isSoundscapeMuted 
                ? "text-neutral-200 bg-white/5" 
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            title={isSoundscapeMuted ? "Unmute Ambient Chords" : "Mute Ambient Chords"}
          >
            {isSoundscapeMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            )}
          </motion.button>
        )}

        <div className="relative w-10 h-10 flex items-center justify-center">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isEngineActive ? stopEngine : startEngine}
            className={`w-9 h-9 rounded-full glass-card flex items-center justify-center cursor-pointer transition-all duration-500 border border-white/5 ${
              isEngineActive 
                ? "text-neutral-300 bg-white/5" 
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {isEngineActive ? (
              <Activity className="w-4 h-4 text-neutral-400" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
      </div>


    </div>
  );
}

export default function Home() {
  return (
    <EmotionFlowProvider>
      <EchoesDashboard />
    </EmotionFlowProvider>
  );
}
