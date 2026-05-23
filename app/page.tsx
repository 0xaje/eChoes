"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import MicOrb from "@/components/MicOrb";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import StatusText from "@/components/StatusText";
import VoicePersonalityPanel from "@/components/VoicePersonalityPanel";
import DemoModeToggle from "@/components/DemoModeToggle";
import SynapticMemoryWeb from "@/components/SynapticMemoryWeb";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import { soundscape } from "@/lib/soundscapeEngine";
import { Sparkles, Radio, Power, BrainCircuit, Activity, Volume2, VolumeX } from "lucide-react";

export default function Home() {
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

  // State hook for Cinematic Demo Mode (Step 7)
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  // Start / Stop and dynamically sync the Ambient Resonance Engine based on active state, emotion, and mute
  useEffect(() => {
    if (isEngineActive && !isSoundscapeMuted) {
      soundscape?.start();
      soundscape?.updateEmotion(currentEmotion, isDemoMode);
    } else {
      soundscape?.stop();
    }
  }, [isEngineActive, currentEmotion, isDemoMode, isSoundscapeMuted]);

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
    demoActive: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-x-hidden p-4 md:p-8 text-white font-sans selection:bg-cyan-500/20 select-none">
      
      {/* 1. Ambient Particles & Dynamic Auroras Background */}
      <AnimatedBackground emotion={currentEmotion} voice={currentVoice} />

      {/* Grid pattern overlay for high-tech digital aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none -z-40" />

      {/* 2. Top Header Navigation - Hides smoothly in Demo Mode */}
      <AnimatePresence>
        {!isDemoMode && (
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
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f1fd]" />
              <span className="font-light text-[10px] tracking-[0.4em] uppercase text-neutral-300">
                ECHOES
              </span>
            </div>

            {/* Dynamic Connection Indicator */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <AnimatePresence mode="wait">
                {isEngineActive ? (
                  <motion.div
                    key="active-indicator"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md"
                  >
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-[8px] uppercase tracking-widest text-emerald-300 font-medium">
                      Echoes Link Active
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle-indicator"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span className="text-[8px] uppercase tracking-widest text-neutral-300 font-medium">
                      Acoustic Presence
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 3. Main Center Area */}
      <main className="flex-1 w-full max-w-7xl flex flex-col items-center justify-center relative px-4 md:px-12 py-20 z-30">
        <AnimatePresence mode="wait">
          {!isEngineActive ? (
            /* PRE-CONNECTION CTA PAGE (Sci-fi Initialization Interface) */
            <motion.div
              key="activation-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center max-w-3xl w-full space-y-8 text-center px-4"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.3em] uppercase bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  ECHOES
                </h1>
                <p className="text-xs font-light text-neutral-400 tracking-[0.2em] leading-relaxed uppercase max-w-md mx-auto">
                  Emotionally Attentive Presence & Ethereal Voice Companion
                </p>
              </div>

              {/* Step 7 Voice Selector integrated on pre-connection screen */}
              <div className="w-full max-w-2xl py-2">
                <VoicePersonalityPanel
                  currentVoice={currentVoice}
                  onVoiceChange={updateVoice}
                  emotion={currentEmotion}
                />
              </div>

              {/* High-Fidelity Synaptic Telemetry Cockpit Dashboard */}
              <div className="w-full max-w-2xl text-left pt-2 px-4 md:px-0">
                {/* Dashboard Cluster Header */}
                <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 select-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f1fd]" />
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-400">
                      Synaptic Calibration Board
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-400/50 uppercase tracking-widest">
                    SYS_CALIBRATION_v4.0
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                  {/* Acoustic Realism Telemetry Card */}
                  <div className="flex flex-col justify-between p-5 rounded-2xl bg-black/40 border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-purple-500/20 transition-all duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-200">
                              Acoustic Realism
                            </h4>
                            <p className="text-[7px] text-purple-400/60 tracking-wider font-mono uppercase">
                              Node_Resonance_Active
                            </p>
                          </div>
                        </div>
                        {/* Animated green heartbeat beacon */}
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                        Voice settings and conversational thresholds adapt in real-time. Mid-sentence pause triggers organic ElevenLabs physical breathing models.
                      </p>
                    </div>

                    {/* Simulated dashboard sub-metrics for visual high-fidelity */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-purple-500" /> LATENCY: <span className="text-neutral-300">32ms</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-purple-500" /> FIDELITY: <span className="text-neutral-300">99.8%</span>
                      </span>
                    </div>
                  </div>

                  {/* Memory Evolution Telemetry Card */}
                  <div className="flex flex-col justify-between p-5 rounded-2xl bg-black/40 border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-200">
                              Memory Evolution
                            </h4>
                            <p className="text-[7px] text-cyan-400/60 tracking-wider font-mono uppercase">
                              Supabase_Ledger_Synced
                            </p>
                          </div>
                        </div>
                        {/* Animated cyan telemetry beacon */}
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                        Persistent themes increment weight up to 5, consolidating your profile. Unused transient details automatically decay.
                      </p>
                    </div>

                    {/* Simulated dashboard sub-metrics for visual high-fidelity */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-cyan-500" /> SYNC RATE: <span className="text-neutral-300">1.2s</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-cyan-500" /> CAPTURE: <span className="text-neutral-300">AUTO</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launch Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startEngine}
                className="w-full max-w-md py-4 rounded-full bg-white/[0.02] border border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-white font-medium text-xs tracking-[0.25em] uppercase shadow-[0_4px_30px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(6,182,212,0.12)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.6),_inset_0_0_20px_rgba(6,182,212,0.25),_0_0_25px_rgba(6,182,212,0.15)] transition-all duration-500 flex items-center justify-center space-x-3 cursor-pointer"
              >
                <Power className="w-4 h-4 text-cyan-400 animate-pulse" strokeWidth={2} />
                <span>Establish Echo</span>
              </motion.button>
            </motion.div>
          ) : (
            /* FULLY DYNAMIC ACTIVE VOICE INTERFACE SCREEN (Sleek, centered immersive layout) */
            <motion.div
              key="companion-screen"
              variants={containerVariants}
              initial="hidden"
              animate={isDemoMode ? "demoActive" : "show"}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center justify-center relative min-h-[500px]"
            >
              {/* Step 4 & 5: Synaptic Memory Constellation Overlay */}
              <SynapticMemoryWeb 
                memories={recentMemories} 
                isActive={isEngineActive} 
                isDemoMode={isDemoMode} 
              />

              {/* Centerpiece 3D Camera / Mouse coordinate tracking drift container */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center transition-all duration-1000"
                animate={isDemoMode ? {
                  rotateX: [0, 2.5, -2.5, 0],
                  rotateY: [0, 3.5, -3.5, 0],
                  y: [0, -5, 5, 0],
                } : {
                  rotateY: mousePos.x,
                  rotateX: -mousePos.y,
                }}
                transition={isDemoMode ? {
                  duration: 24,
                  repeat: Infinity,
                  ease: "easeInOut",
                } : {
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Central MicOrb bound to actual voice values, emotion, and voice profiles */}
                <MicOrb
                  state={state === "idle" ? "listening" : state}
                  volume={averageAmplitude}
                  onClick={handleInterruption}
                  emotion={currentEmotion}
                  voice={currentVoice}
                  isDemoMode={isDemoMode}
                />
              </motion.div>

              {/* Reactive Waveform Visualizer + Status Title */}
              <motion.div 
                variants={itemVariants} 
                className="mt-8 flex flex-col items-center justify-center w-full"
              >
                <VoiceVisualizer
                  state={state === "idle" ? "listening" : state}
                  audioLevels={audioLevels}
                  averageAmplitude={averageAmplitude}
                  emotion={currentEmotion}
                  voice={currentVoice}
                />
                
                <div className="mt-2 opacity-80 scale-90">
                  <StatusText
                    state={state === "idle" ? "listening" : state}
                    emotion={currentEmotion}
                    voice={currentVoice}
                  />
                </div>
              </motion.div>

              {/* RIGHT SIDEBAR: Dynamic Memory Glimpses from Supabase traces */}
              <AnimatePresence>
                {!isDemoMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.7 }}
                    className="hidden lg:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex-col gap-6 z-40 pointer-events-none"
                  >
                    {recentMemories.slice(0, 3).map((memory, index) => (
                      <motion.div
                        key={memory.id || index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: index === 0 ? 0.85 : index === 1 ? 0.55 : 0.25 }}
                        whileHover={{ opacity: 1, scale: 1.02 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5 }}
                        className={`glass-card p-5 rounded-2xl w-52 hover:opacity-100 transition-all duration-500 pointer-events-auto cursor-pointer ${
                          index === 1 ? "ml-4" : index === 2 ? "ml-8" : ""
                        }`}
                      >
                        <p className="font-light text-[8px] tracking-[0.2em] text-cyan-400 mb-2 uppercase opacity-70">
                          {index === 0 ? "PRIMARY TRACE" : index === 1 ? "STABILITY" : "PERSISTENCE"}
                        </p>
                        <p className="text-[10px] text-neutral-300 font-light leading-relaxed max-h-16 overflow-hidden">
                          {memory.memory_text}
                        </p>
                      </motion.div>
                    ))}

                    {recentMemories.length === 0 && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          whileHover={{ opacity: 0.8 }}
                          className="glass-card p-5 rounded-2xl w-52 pointer-events-auto cursor-pointer"
                        >
                          <p className="font-light text-[8px] tracking-[0.2em] text-cyan-400 mb-2 uppercase opacity-70">INSIGHT</p>
                          <p className="text-[10px] text-neutral-300 font-light leading-relaxed">
                            Atmosphere is {currentEmotion}
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.2 }}
                          whileHover={{ opacity: 0.8 }}
                          className="glass-card p-5 rounded-2xl w-52 ml-4 pointer-events-auto cursor-pointer"
                        >
                          <p className="font-light text-[8px] tracking-[0.2em] text-cyan-400 mb-2 uppercase opacity-70">RESONANCE</p>
                          <p className="text-[10px] text-neutral-300 font-light leading-relaxed">
                            Atmospheric presence active.
                          </p>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Bottom Subtitles and Narrative Area */}
      <footer className="w-full relative px-6 pb-12 z-30 flex flex-col items-center shrink-0">
        <AnimatePresence>
          {isEngineActive && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 15, opacity: 0 }}
              className="w-full max-w-2xl px-6 relative mb-6 select-text"
            >
              {/* Wide masked cinematic subtitle backdrop-blur box */}
              <div className="w-full flex justify-center subtitle-mask">
                <div className="backdrop-blur-md px-12 py-5 text-center rounded-2xl glass-card relative min-h-[88px] flex items-center justify-center w-full border border-white/5 shadow-2xl">
                  <AnimatePresence mode="wait">
                    {state === "speaking" && aiTranscript.trim() ? (
                      <motion.p
                        key="ai-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.95 }}
                        exit={{ opacity: 0 }}
                        className="text-sm md:text-base font-light text-cyan-200 leading-relaxed tracking-wide"
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
                    ) : state === "listening" && transcript.trim() ? (
                      <motion.p
                        key="user-subtitles"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 0.85, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm md:text-base font-light text-purple-200 leading-relaxed tracking-wide italic"
                      >
                        &ldquo;{transcript}&rdquo;
                      </motion.p>
                    ) : state === "thinking" ? (
                      <motion.div
                        key="thinking-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.35, 0.75, 0.35] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-light flex items-center space-x-2 select-none"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Distilling synaptic response...</span>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="idle-subtitles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ duration: 1.5 }}
                        className="text-xs md:text-sm font-light text-neutral-400 leading-relaxed tracking-wider animate-pulse duration-[5000ms] select-none"
                      >
                        &ldquo;I sense a shift in your resonance today. Shall we explore the drift?&rdquo;
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Sleek Dynamic Text Input Fallback (Step 3 /resiliency option) */}
              {!isDemoMode && (
                <div className="mt-5 w-full flex justify-center">
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
                    className="w-full max-w-lg flex items-center bg-black/45 backdrop-blur-md border border-white/5 rounded-full px-5 py-2 hover:border-cyan-500/20 focus-within:border-cyan-500/40 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-500 shadow-xl"
                  >
                    <input
                      type="text"
                      name="message"
                      placeholder="Whisper to the Echo (keyboard mode active)..."
                      className="flex-1 bg-transparent border-0 outline-none text-xs font-light text-neutral-300 placeholder-neutral-500 tracking-wider px-2 py-1.5"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-400/30 flex items-center justify-center transition-all duration-300 group cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-400 group-hover:scale-105 transition-all" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credit details */}
        <div className="text-[9px] font-light text-neutral-600 tracking-[0.2em] uppercase flex items-center space-x-2 select-none mt-2">
          <span>ElevenLabs Speech SDK 4.0 ready</span>
          <span>•</span>
          <span>Atmospheric Presence Mode Active</span>
        </div>
      </footer>

      {/* 5. Floating Bottom-Left Voice Personality Drawer */}
      {isEngineActive && !isDemoMode && (
        <div className="fixed bottom-6 left-8 md:left-12 z-50 flex flex-col items-start gap-4">
          <AnimatePresence>
            {isVoicePanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-4 rounded-2xl w-[335px] md:w-[350px] max-w-sm mb-2 shadow-2xl relative"
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
            className="flex items-center gap-3 px-5 py-2.5 rounded-full glass-card group hover:scale-105 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <Radio className={`w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300 ${isEngineActive ? "animate-pulse" : ""}`} />
            <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-300 group-hover:text-white transition-colors">
              {currentVoice}
            </span>
          </button>
        </div>
      )}

      {/* 6. Floating Bottom-Right Active Mic / Neural Toggle */}
      {!isDemoMode && (
        <div className="fixed bottom-6 right-8 md:right-12 z-50 flex items-center gap-3">
          {/* Elegant Mute / Unmute Ambient Soundscape Toggle */}
          {isEngineActive && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSoundscapeMuted(prev => !prev)}
              className={`w-11 h-11 rounded-full glass-card flex items-center justify-center cursor-pointer transition-all duration-500 border ${
                !isSoundscapeMuted 
                  ? "border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.3)] text-emerald-400" 
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
              title={isSoundscapeMuted ? "Unmute Ambient Chords" : "Mute Ambient Chords"}
            >
              {isSoundscapeMuted ? (
                <VolumeX className="w-4.5 h-4.5 text-neutral-400" />
              ) : (
                <Volume2 className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
              )}
            </motion.button>
          )}

          <div className="relative w-12 h-12 flex items-center justify-center">
            {isEngineActive && (
              <div className="absolute inset-0 bg-cyan-400 rounded-full opacity-10 animate-ping pointer-events-none" />
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isEngineActive ? stopEngine : startEngine}
              className={`w-11 h-11 rounded-full glass-card flex items-center justify-center cursor-pointer transition-all duration-500 border ${
                isEngineActive 
                  ? "border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-cyan-400" 
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              {isEngineActive ? (
                <Activity className="w-5 h-5 animate-pulse text-cyan-400" />
              ) : (
                <Power className="w-4 h-4 text-neutral-300" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Floating Demo Mode switch in bottom-center */}
      {isEngineActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <DemoModeToggle
            isDemoMode={isDemoMode}
            onToggle={() => setIsDemoMode((prev) => !prev)}
          />
        </div>
      )}
    </div>
  );
}
