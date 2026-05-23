import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type EmotionType = "calm" | "anxious" | "reflective" | "excited" | "lonely" | "melancholic" | "playful";

export interface EmotionState {
  emotion: EmotionType;
  intensity: number;
  stability: number;
}

export interface SystemParameters {
  // OrbParticleField variables
  particleMaxCount: number;
  particleBaseSpeed: number;
  particleSpawnChance: number;
  particleDecayMin: number;
  particleDecayMax: number;
  particleColorRange: [number, number]; // HSL Hue min/max
  particleJitter: number;
  particleOrbit: boolean;
  particleGravity: number;

  // MicOrb visual parameters
  orbPulseIntensity: number;
  orbGlowBrightness: number;
  orbBreathingSpeed: number; // millisecond duration of breathing pulse cycle

  // Voice Speech Synthesis settings
  voiceSpeechRate: number;
  voiceSpeechPitch: number;

  // Soundscape Synth Drone parameters
  droneFilterFrequency: number;
  droneVolume: number;

  // UI styling guidelines
  uiTransitionSpeed: number; // css animation duration in ms
  uiGlowIntensity: number; // opacity multiplier 0-1
  uiSubtitleFadeMs: number;
}

const EMOTION_PRESETS: Record<EmotionType, { state: EmotionState; params: SystemParameters }> = {
  calm: {
    state: { emotion: "calm", intensity: 0.3, stability: 0.9 },
    params: {
      particleMaxCount: 120,
      particleBaseSpeed: 0.4,
      particleSpawnChance: 0.15,
      particleDecayMin: 0.005,
      particleDecayMax: 0.015,
      particleColorRange: [170, 195], // Soothing Bioluminescent Cyan/Teal
      particleJitter: 0.1,
      particleOrbit: false,
      particleGravity: 0.0,
      orbPulseIntensity: 0.4,
      orbGlowBrightness: 0.5,
      orbBreathingSpeed: 3000, // Slow deep breathing
      voiceSpeechRate: 0.98,
      voiceSpeechPitch: 1.0,
      droneFilterFrequency: 140,
      droneVolume: 0.18,
      uiTransitionSpeed: 1000,
      uiGlowIntensity: 0.4,
      uiSubtitleFadeMs: 800,
    }
  },
  anxious: {
    state: { emotion: "anxious", intensity: 0.85, stability: 0.2 },
    params: {
      particleMaxCount: 240,
      particleBaseSpeed: 2.0,
      particleSpawnChance: 0.5,
      particleDecayMin: 0.02,
      particleDecayMax: 0.04,
      particleColorRange: [230, 260], // Steel Indigo / Slate
      particleJitter: 1.8, // Chaotic jitter
      particleOrbit: false,
      particleGravity: 0.0,
      orbPulseIntensity: 0.95,
      orbGlowBrightness: 0.8,
      orbBreathingSpeed: 850, // Rapid, shallow nervous breath
      voiceSpeechRate: 0.88,
      voiceSpeechPitch: 1.05,
      droneFilterFrequency: 95, // Muffled, sub-bass heavy frequency
      droneVolume: 0.15,
      uiTransitionSpeed: 300, // Twitchy, fast timing
      uiGlowIntensity: 0.85,
      uiSubtitleFadeMs: 400,
    }
  },
  reflective: {
    state: { emotion: "reflective", intensity: 0.4, stability: 0.95 },
    params: {
      particleMaxCount: 180,
      particleBaseSpeed: 0.5,
      particleSpawnChance: 0.25,
      particleDecayMin: 0.003,
      particleDecayMax: 0.008, // Long-lived trails
      particleColorRange: [265, 290], // Deep Amethyst purple and golden halos
      particleJitter: 0.05,
      particleOrbit: true, // Particles orbit in spiral vortexes
      particleGravity: 0.0,
      orbPulseIntensity: 0.3,
      orbGlowBrightness: 0.4,
      orbBreathingSpeed: 5000, // Deep, meditative pause breath
      voiceSpeechRate: 0.9,
      voiceSpeechPitch: 0.98,
      droneFilterFrequency: 190,
      droneVolume: 0.20,
      uiTransitionSpeed: 1200,
      uiGlowIntensity: 0.3,
      uiSubtitleFadeMs: 1200,
    }
  },
  excited: {
    state: { emotion: "excited", intensity: 0.95, stability: 0.7 },
    params: {
      particleMaxCount: 300,
      particleBaseSpeed: 2.2,
      particleSpawnChance: 0.85,
      particleDecayMin: 0.015,
      particleDecayMax: 0.03,
      particleColorRange: [300, 335], // Energetic Neon Pink / Magenta
      particleJitter: 0.4,
      particleOrbit: false,
      particleGravity: 0.0,
      orbPulseIntensity: 1.0,
      orbGlowBrightness: 1.0,
      orbBreathingSpeed: 1200,
      voiceSpeechRate: 1.1,
      voiceSpeechPitch: 1.05,
      droneFilterFrequency: 260,
      droneVolume: 0.16,
      uiTransitionSpeed: 400,
      uiGlowIntensity: 1.0,
      uiSubtitleFadeMs: 300,
    }
  },
  lonely: {
    state: { emotion: "lonely", intensity: 0.2, stability: 0.5 },
    params: {
      particleMaxCount: 45, // Sparse, isolated elements
      particleBaseSpeed: 0.25,
      particleSpawnChance: 0.06,
      particleDecayMin: 0.008,
      particleDecayMax: 0.018,
      particleColorRange: [18, 32], // Dim, warm copper/amber
      particleJitter: 0.08,
      particleOrbit: false,
      particleGravity: 0.05, // Falling particles like fading ashes
      orbPulseIntensity: 0.15,
      orbGlowBrightness: 0.2,
      orbBreathingSpeed: 4500, // Meditative, sighing breath
      voiceSpeechRate: 0.85,
      voiceSpeechPitch: 0.95,
      droneFilterFrequency: 110,
      droneVolume: 0.12,
      uiTransitionSpeed: 1500,
      uiGlowIntensity: 0.15,
      uiSubtitleFadeMs: 1500,
    }
  },
  melancholic: {
    state: { emotion: "melancholic", intensity: 0.5, stability: 0.75 },
    params: {
      particleMaxCount: 100,
      particleBaseSpeed: 0.35,
      particleSpawnChance: 0.1,
      particleDecayMin: 0.006,
      particleDecayMax: 0.016,
      particleColorRange: [255, 275], // Deep Melancholy Violet/Indigo
      particleJitter: 0.1,
      particleOrbit: false,
      particleGravity: 0.0,
      orbPulseIntensity: 0.35,
      orbGlowBrightness: 0.3,
      orbBreathingSpeed: 4000,
      voiceSpeechRate: 0.85,
      voiceSpeechPitch: 0.95,
      droneFilterFrequency: 110,
      droneVolume: 0.22,
      uiTransitionSpeed: 1300,
      uiGlowIntensity: 0.3,
      uiSubtitleFadeMs: 1300,
    }
  },
  playful: {
    state: { emotion: "playful", intensity: 0.75, stability: 0.8 },
    params: {
      particleMaxCount: 200,
      particleBaseSpeed: 1.5,
      particleSpawnChance: 0.6,
      particleDecayMin: 0.01,
      particleDecayMax: 0.025,
      particleColorRange: [330, 360], // Playful Vibrant Rose Gold / Coral Pink
      particleJitter: 0.3,
      particleOrbit: false,
      particleGravity: 0.0,
      orbPulseIntensity: 0.75,
      orbGlowBrightness: 0.75,
      orbBreathingSpeed: 1800,
      voiceSpeechRate: 1.15,
      voiceSpeechPitch: 1.08,
      droneFilterFrequency: 230,
      droneVolume: 0.16,
      uiTransitionSpeed: 500,
      uiGlowIntensity: 0.8,
      uiSubtitleFadeMs: 500,
    }
  }
};

interface EmotionFlowContextType {
  emotion: EmotionType;
  intensity: number;
  stability: number;
  activeParams: SystemParameters;
  updateEmotion: (newEmotion: EmotionType) => void;
}

const EmotionFlowContext = createContext<EmotionFlowContextType | undefined>(undefined);

export const EmotionFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEmotion, setCurrentEmotionState] = useState<EmotionType>("calm");
  const [intensity, setIntensity] = useState(0.3);
  const [stability, setStability] = useState(0.9);
  const [activeParams, setActiveParams] = useState<SystemParameters>(EMOTION_PRESETS.calm.params);

  const targetEmotionRef = useRef<EmotionType>("calm");
  const activeParamsRef = useRef<SystemParameters>({ ...EMOTION_PRESETS.calm.params });

  const updateEmotion = (newEmotion: EmotionType) => {
    if (!EMOTION_PRESETS[newEmotion]) return;
    targetEmotionRef.current = newEmotion;
    const preset = EMOTION_PRESETS[newEmotion];
    setCurrentEmotionState(newEmotion);
    setIntensity(preset.state.intensity);
    setStability(preset.state.stability);
    console.log(`🌌 [EmotionFlowDirector] Transitioning to emotional state: ${newEmotion.toUpperCase()}`);
  };

  useEffect(() => {
    let animationFrameId: number;

    const lerp = (start: number, end: number, amt: number) => {
      return start + (end - start) * amt;
    };

    const updateLoop = () => {
      const targetPreset = EMOTION_PRESETS[targetEmotionRef.current];
      const targetParams = targetPreset.params;
      const currentParams = activeParamsRef.current;
      const lerpAmt = 0.07; // Yields a gorgeous, fluid exponential glide that completes over ~600ms - 800ms

      const nextParams: SystemParameters = {
        particleMaxCount: Math.round(lerp(currentParams.particleMaxCount, targetParams.particleMaxCount, lerpAmt)),
        particleBaseSpeed: lerp(currentParams.particleBaseSpeed, targetParams.particleBaseSpeed, lerpAmt),
        particleSpawnChance: lerp(currentParams.particleSpawnChance, targetParams.particleSpawnChance, lerpAmt),
        particleDecayMin: lerp(currentParams.particleDecayMin, targetParams.particleDecayMin, lerpAmt),
        particleDecayMax: lerp(currentParams.particleDecayMax, targetParams.particleDecayMax, lerpAmt),
        particleColorRange: [
          lerp(currentParams.particleColorRange[0], targetParams.particleColorRange[0], lerpAmt),
          lerp(currentParams.particleColorRange[1], targetParams.particleColorRange[1], lerpAmt),
        ] as [number, number],
        particleJitter: lerp(currentParams.particleJitter, targetParams.particleJitter, lerpAmt),
        particleOrbit: targetParams.particleOrbit, // Boolean states do not interpolate, they update at target bounds
        particleGravity: lerp(currentParams.particleGravity, targetParams.particleGravity, lerpAmt),
        
        orbPulseIntensity: lerp(currentParams.orbPulseIntensity, targetParams.orbPulseIntensity, lerpAmt),
        orbGlowBrightness: lerp(currentParams.orbGlowBrightness, targetParams.orbGlowBrightness, lerpAmt),
        orbBreathingSpeed: lerp(currentParams.orbBreathingSpeed, targetParams.orbBreathingSpeed, lerpAmt),
        
        voiceSpeechRate: lerp(currentParams.voiceSpeechRate, targetParams.voiceSpeechRate, lerpAmt),
        voiceSpeechPitch: lerp(currentParams.voiceSpeechPitch, targetParams.voiceSpeechPitch, lerpAmt),
        
        droneFilterFrequency: lerp(currentParams.droneFilterFrequency, targetParams.droneFilterFrequency, lerpAmt),
        droneVolume: lerp(currentParams.droneVolume, targetParams.droneVolume, lerpAmt),
        
        uiTransitionSpeed: lerp(currentParams.uiTransitionSpeed, targetParams.uiTransitionSpeed, lerpAmt),
        uiGlowIntensity: lerp(currentParams.uiGlowIntensity, targetParams.uiGlowIntensity, lerpAmt),
        uiSubtitleFadeMs: lerp(currentParams.uiSubtitleFadeMs, targetParams.uiSubtitleFadeMs, lerpAmt),
      };

      activeParamsRef.current = nextParams;
      setActiveParams(nextParams);

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <EmotionFlowContext.Provider
      value={{
        emotion: currentEmotion,
        intensity,
        stability,
        activeParams,
        updateEmotion,
      }}
    >
      {children}
    </EmotionFlowContext.Provider>
  );
};

export const useEmotionFlow = () => {
  const context = useContext(EmotionFlowContext);
  if (context === undefined) {
    throw new Error("useEmotionFlow must be used within an EmotionFlowProvider");
  }
  return context;
};
