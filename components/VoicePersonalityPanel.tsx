"use client";

import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import Image from "next/image";

interface VoiceProfile {
  name: string;
  role: string;
  heritage: string;
  avatarUrl: string;
  description: string;
  themeClass: string;
  glowClass: string;
  accentColor: string;
  indicatorColor: string;
  tone: string;
}

interface VoicePersonalityPanelProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  emotion: string;
  compact?: boolean; // New prop to seamlessly switch between wide dashboard grid and compact session drawer
}

export default function VoicePersonalityPanel({
  currentVoice,
  onVoiceChange,
  emotion,
  compact = false,
}: VoicePersonalityPanelProps) {

  const profiles: VoiceProfile[] = [
    {
      name: "Bella",
      role: "Warm Companion",
      heritage: "Empathetic Presence",
      avatarUrl: "/images/avatar_bella_yoruba.png",
      description: "An intimate, deeply empathetic female presence. Soothing, warm, and close, designed for comfort and close daily companionship.",
      themeClass: "from-purple-500/10 to-indigo-500/5 hover:from-purple-500/20 hover:to-indigo-500/10",
      glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]",
      accentColor: "text-purple-400 border-purple-500/30",
      indicatorColor: "bg-purple-400 shadow-[0_0_10px_#a855f7]",
      tone: "Warm Empathy",
    },
    {
      name: "Rachel",
      role: "Futuristic Oracle",
      heritage: "Analytical Intellect",
      avatarUrl: "/images/avatar_rachel_igbo.png",
      description: "An intellectually curious voice radiating analytical precision and high-fidelity clarity. Futuristic, crisp, and refined.",
      themeClass: "from-cyan-500/10 to-blue-500/5 hover:from-cyan-500/20 hover:to-blue-500/10",
      glowClass: "shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]",
      accentColor: "text-cyan-400 border-cyan-500/30",
      indicatorColor: "bg-cyan-400 shadow-[0_0_10px_#06b6d4]",
      tone: "Crystal Intellect",
    },
    {
      name: "Antoni",
      role: "Grounded Anchor",
      heritage: "Resonant Calmness",
      avatarUrl: "/images/avatar_antoni_hausa.png",
      description: "A deep, exceptionally calm masculine resonance offering reassurance and stability. Serene, slow, and grounding.",
      themeClass: "from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10",
      glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]",
      accentColor: "text-blue-400 border-blue-500/30",
      indicatorColor: "bg-blue-400 shadow-[0_0_10px_#3b82f6]",
      tone: "Grounded Calmness",
    },
  ];

  // --- 1. COMPACT DRAWER RENDER (Strict w-[320px] boundary layout with zero overlap) ---
  if (compact) {
    return (
      <div className="w-full select-none flex flex-col gap-2.5">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1 px-1">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 font-bold">
              Select Voice
            </span>
          </div>
          <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">
            {emotion}
          </span>
        </div>

        {/* Compact Stack - Render as a beautiful vertical list */}
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => {
            const isActive = currentVoice === profile.name;

            return (
              <motion.div
                key={profile.name}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onVoiceChange(profile.name)}
                className={`relative p-3 rounded-xl border transition-all duration-500 flex flex-col gap-2 ${isActive
                    ? `bg-black/70 border-white/15 shadow-[0_0_12px_rgba(6,182,212,0.1)]`
                    : "bg-neutral-900/30 border-white/5 hover:border-white/10"
                  }`}
              >
                {/* Subtle colored background card glow */}
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${profile.themeClass} opacity-10 transition-opacity duration-500 -z-10`}
                />

                {/* Header Row */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2.5">
                    {/* Compact Cyber Avatar */}
                    <div className={`relative w-8 h-8 rounded-full overflow-hidden border transition-all duration-500 shrink-0 ${isActive ? `border-current ${profile.accentColor}` : "border-white/10"
                      }`}>
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[11px] font-bold text-white tracking-wider">
                          {profile.name}
                        </h4>
                        <span className="text-[7px] px-1 py-0.25 rounded bg-white/5 text-neutral-400 font-medium tracking-wide uppercase border border-white/5 shrink-0">
                          {profile.name === "Bella" ? "Warm" : profile.name === "Rachel" ? "Oracle" : "Anchor"}
                        </span>
                      </div>
                      <p className={`text-[8px] uppercase tracking-wider mt-0.5 font-medium ${isActive ? profile.accentColor : "text-neutral-500"}`}>
                        {profile.heritage}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0 ${isActive
                        ? `${profile.accentColor} border-current`
                        : "border-white/10"
                      }`}
                  >
                    {isActive && (
                      <div className={`w-1.5 h-1.5 rounded-full ${profile.indicatorColor}`} />
                    )}
                  </div>
                </div>

                {/* Cozy description inside row boundaries (no vertical text spills) */}
                <p className="text-[9px] text-neutral-400 font-light leading-relaxed select-none px-0.5 border-t border-white/5 pt-1.5">
                  {profile.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- 2. SPACIOUS WIDE SCREEN RENDER (Dashboard pre-connection calibration screen) ---
  return (
    <div className="w-full max-w-2xl mx-auto px-4 select-none">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-neutral-400 animate-pulse" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-semibold">
            Vocal Resonance Profile
          </span>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900/50 border border-white/5 text-[9px] text-neutral-400 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>Atmosphere: {emotion}</span>
        </div>
      </div>

      {/* Grid of Personality Cards (Responsive and spacious) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const isActive = currentVoice === profile.name;

          return (
            <motion.div
              key={profile.name}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onVoiceChange(profile.name)}
              className={`relative group cursor-pointer rounded-2xl p-4 md:p-5 flex flex-col justify-between border transition-all duration-700 backdrop-blur-xl ${isActive
                  ? `bg-black/60 border-white/15 ${profile.glowClass}`
                  : "bg-neutral-900/30 border-white/5"
                }`}
            >
              {/* Profile card background glow */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${profile.themeClass} opacity-40 group-hover:opacity-60 transition-opacity duration-700 -z-10`}
              />

              {/* Card Header (Avatar + Name / Heritage) */}
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center space-x-3">
                  {/* High-fidelity Cyber Avatar */}
                  <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all duration-700 shrink-0 ${isActive ? `border-current ${profile.accentColor}` : "border-white/10"
                    }`}>
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold tracking-wider text-white">
                      {profile.name}
                    </h4>
                    <p className={`text-[9px] uppercase tracking-widest mt-0.5 font-medium ${isActive ? profile.accentColor : "text-neutral-400"}`}>
                      {profile.heritage}
                    </p>
                  </div>
                </div>

                {/* Selected Indicator Check */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-500 mt-1 shrink-0 ${isActive
                      ? `${profile.accentColor} border-current`
                      : "border-white/10"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeVoiceCheck"
                      className={`w-1.5 h-1.5 rounded-full ${profile.indicatorColor}`}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed my-4 select-none">
                {profile.description}
              </p>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-1">
                <span className="text-[8px] uppercase tracking-widest text-neutral-500">
                  Role
                </span>
                <span className={`text-[9px] font-medium tracking-wide ${isActive ? profile.accentColor : "text-neutral-400"}`}>
                  {profile.role}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
