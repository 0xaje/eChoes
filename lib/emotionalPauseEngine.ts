import { EmotionType } from "./emotionFlowDirector";

export interface PauseParameters {
  preResponseDelayMs: number; // Intentional silence duration before AI processes dialogue
  orbDimmingFactor: number;     // Scale factor for glow brightness during reflection
  particleDensityFactor: number; // Scale factor for particle count and spawn rates
  audioDuckerFactor: number;    // Softening coefficient for ambient background chords
  breathSlowFactor: number;     // Multiplier to slow down orb breathing y-drifts
}

/**
 * Computes custom pause and silence parameters dynamically based on the current emotional state
 * to generate a deeply organic "conscious hesitation" phase right after the user finishes speaking.
 */
export function getPauseParameters(emotion: EmotionType): PauseParameters {
  switch (emotion) {
    case "reflective":
      return {
        preResponseDelayMs: 2400, // Longest silent contemplation (up to 2.5s)
        orbDimmingFactor: 0.50,   // Dims significantly to simulate internal mental search
        particleDensityFactor: 0.20,
        audioDuckerFactor: 0.45,  // Deep acoustic space ducking
        breathSlowFactor: 2.2,    // Breathing slows down to a near halt
      };
    case "melancholic":
      return {
        preResponseDelayMs: 2000, // Slower turn-taking rhythm
        orbDimmingFactor: 0.60,
        particleDensityFactor: 0.25,
        audioDuckerFactor: 0.55,
        breathSlowFactor: 1.8,
      };
    case "calm":
      return {
        preResponseDelayMs: 1600, // Balanced, peaceful reflection pause
        orbDimmingFactor: 0.70,
        particleDensityFactor: 0.35,
        audioDuckerFactor: 0.65,
        breathSlowFactor: 1.5,
      };
    case "lonely":
      return {
        preResponseDelayMs: 1800, // Faint, tentative hesitation
        orbDimmingFactor: 0.55,
        particleDensityFactor: 0.30,
        audioDuckerFactor: 0.50,
        breathSlowFactor: 1.6,
      };
    case "anxious":
      return {
        preResponseDelayMs: 900,  // Shorter, reactive pre-response pause
        orbDimmingFactor: 0.80,   // Dims less (keeps a high state of nervous alert)
        particleDensityFactor: 0.50,
        audioDuckerFactor: 0.75,
        breathSlowFactor: 1.1,
      };
    case "excited":
      return {
        preResponseDelayMs: 500,  // Fast response transitions
        orbDimmingFactor: 0.95,   // Almost zero dimming, stays fully bright
        particleDensityFactor: 0.85,
        audioDuckerFactor: 0.90,  // Softens very little
        breathSlowFactor: 0.9,    // Fast rapid breathing
      };
    case "playful":
      return {
        preResponseDelayMs: 800,  // Rapid responsive spark
        orbDimmingFactor: 0.85,
        particleDensityFactor: 0.70,
        audioDuckerFactor: 0.80,
        breathSlowFactor: 1.0,
      };
    default:
      return {
        preResponseDelayMs: 1200,
        orbDimmingFactor: 0.70,
        particleDensityFactor: 0.40,
        audioDuckerFactor: 0.70,
        breathSlowFactor: 1.4,
      };
  }
}
