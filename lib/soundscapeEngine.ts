"use client";

export type SoundscapeEmotion = 
  | "calm" 
  | "melancholic" 
  | "anxious" 
  | "reflective" 
  | "playful" 
  | "excited" 
  | "lonely";

export class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Drone Layer (Cinematic Low Hum)
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  
  // Pad Layer (Slow Orbital Evolving Chords)
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padPanner: StereoPannerNode | null = null;
  
  // Shimmer/Texture Layer (Higher Airy Frequency Elements)
  private textureOsc: OscillatorNode | null = null;
  private textureGain: GainNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;
  private texturePanner: StereoPannerNode | null = null;

  // LFOs for Evolving Motion
  private lfoFilter: OscillatorNode | null = null;
  private lfoPan: OscillatorNode | null = null;
  
  private isStarted = false;
  private currentEmotion: SoundscapeEmotion = "calm";
  private isDemoModeActive = false;

  constructor() {
    // Lazy-instantiated on user interaction
  }

  public init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser.");
      return;
    }
    
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public start() {
    this.init();
    if (!this.ctx || this.isStarted) return;
    
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    this.isStarted = true;

    // --- 1. DEEP DRONE LAYER (Low-frequency cinematic foundation) ---
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    this.droneFilter = this.ctx.createBiquadFilter();

    // 55Hz (A1) and slightly detuned 55.4Hz
    this.droneOsc1.type = "sine";
    this.droneOsc1.frequency.setValueAtTime(55, t);
    
    this.droneOsc2.type = "triangle";
    this.droneOsc2.frequency.setValueAtTime(55.4, t);

    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.setValueAtTime(110, t); // Cinematic cut-off
    this.droneFilter.Q.setValueAtTime(3, t);

    this.droneGain.gain.setValueAtTime(0.2, t);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain!);

    // --- 2. EVOLVING HARMONIC PAD LAYER (Drifting chord presence) ---
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    this.padFilter = this.ctx.createBiquadFilter();
    this.padPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    // A2 (110Hz) and E3 (165Hz) - Ethereal open fifth chord
    this.padOsc1.type = "triangle";
    this.padOsc1.frequency.setValueAtTime(110, t);
    
    this.padOsc2.type = "sine";
    this.padOsc2.frequency.setValueAtTime(165, t);

    this.padFilter.type = "lowpass";
    this.padFilter.frequency.setValueAtTime(280, t);
    this.padFilter.Q.setValueAtTime(1, t);

    this.padGain.gain.setValueAtTime(0.08, t);

    this.padOsc1.connect(this.padFilter);
    this.padOsc2.connect(this.padFilter);

    if (this.padPanner) {
      this.padFilter.connect(this.padPanner);
      this.padPanner.connect(this.padGain);
      this.padPanner.pan.setValueAtTime(0, t);
    } else {
      this.padFilter.connect(this.padGain);
    }

    this.padGain.connect(this.masterGain!);

    // --- 3. AIRY TEXTURE/SHIMMER LAYER (High spacious frequency) ---
    this.textureOsc = this.ctx.createOscillator();
    this.textureGain = this.ctx.createGain();
    this.textureFilter = this.ctx.createBiquadFilter();
    this.texturePanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    this.textureOsc.type = "sine";
    this.textureOsc.frequency.setValueAtTime(440, t); // Resonant frequency A4

    this.textureFilter.type = "bandpass";
    this.textureFilter.frequency.setValueAtTime(880, t);
    this.textureFilter.Q.setValueAtTime(2, t);

    this.textureGain.gain.setValueAtTime(0.015, t);

    this.textureOsc.connect(this.textureFilter);
    if (this.texturePanner) {
      this.textureFilter.connect(this.texturePanner);
      this.texturePanner.connect(this.textureGain);
      this.texturePanner.pan.setValueAtTime(0.5, t);
    } else {
      this.textureFilter.connect(this.textureGain);
    }
    this.textureGain.connect(this.masterGain!);

    // --- 4. MOTION INTERACTION LFOS (Continuous slow orbital drift) ---
    this.lfoFilter = this.ctx.createOscillator();
    this.lfoPan = this.ctx.createOscillator();

    this.lfoFilter.frequency.setValueAtTime(0.08, t); // Very slow 12s cycle
    this.lfoPan.frequency.setValueAtTime(0.04, t);    // Ultra slow 25s panning cycle

    // Connect LFO Pan to spatial panner if supported
    if (this.padPanner) {
      const panGain = this.ctx.createGain();
      panGain.gain.setValueAtTime(0.7, t); // Maximum pan width
      this.lfoPan.connect(panGain);
      panGain.connect(this.padPanner.pan);
    }

    // Connect LFO Filter to Pad Filter frequency to create breathing pads
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.setValueAtTime(50, t); // Cutoff sweep range +/- 50Hz
    this.lfoFilter.connect(filterLfoGain);
    filterLfoGain.connect(this.padFilter.frequency);

    // --- Start all nodes ---
    this.droneOsc1.start(t);
    this.droneOsc2.start(t);
    this.padOsc1.start(t);
    this.padOsc2.start(t);
    this.textureOsc.start(t);
    this.lfoFilter.start(t);
    this.lfoPan.start(t);

    // Smoothly fade in master soundscape volume to make launch spectacular
    this.masterGain!.gain.linearRampToValueAtTime(0.85, t + 4);
    
    // Apply baseline emotional weights
    this.updateEmotion(this.currentEmotion, this.isDemoModeActive);
  }

  public updateEmotion(emotion: string, isDemoMode = false) {
    this.currentEmotion = emotion as SoundscapeEmotion;
    this.isDemoModeActive = isDemoMode;
    
    if (!this.ctx || !this.isStarted) return;
    
    const t = this.ctx.currentTime;
    const fadeTime = 4.0; // Slow, organic, beautiful 4-second crossfade transitions
    
    // Demo Mode increases sound richness, harmonic presence, and base levels
    const demoMultiplier = isDemoMode ? 1.4 : 1.0;

    switch (emotion) {
      case "calm":
        this.droneGain?.gain.setTargetAtTime(0.24 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(110, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.12 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(320, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.012 * demoMultiplier, t, fadeTime);
        break;

      case "melancholic":
        this.droneGain?.gain.setTargetAtTime(0.16 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(90, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.07 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(240, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.03 * demoMultiplier, t, fadeTime);
        break;

      case "anxious":
        this.droneGain?.gain.setTargetAtTime(0.35 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(80, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.05 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(180, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.005, t, fadeTime);
        break;

      case "reflective":
        this.droneGain?.gain.setTargetAtTime(0.2 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(120, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.14 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(380, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.02 * demoMultiplier, t, fadeTime);
        break;

      case "playful":
      case "excited":
        this.droneGain?.gain.setTargetAtTime(0.15 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(130, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.16 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(500, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.04 * demoMultiplier, t, fadeTime);
        break;

      case "lonely":
        this.droneGain?.gain.setTargetAtTime(0.18 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(100, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.06 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(220, t, fadeTime);
        
        this.textureGain?.gain.setTargetAtTime(0.025 * demoMultiplier, t, fadeTime);
        break;

      default:
        this.droneGain?.gain.setTargetAtTime(0.2, t, fadeTime);
        this.padGain?.gain.setTargetAtTime(0.08, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.015, t, fadeTime);
        break;
    }
  }

  public stop() {
    if (!this.ctx || !this.isStarted) return;
    
    const t = this.ctx.currentTime;
    
    this.masterGain?.gain.linearRampToValueAtTime(0, t + 1.5);
    
    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.padOsc1?.stop();
        this.padOsc2?.stop();
        this.textureOsc?.stop();
        this.lfoFilter?.stop();
        this.lfoPan?.stop();
        
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.padOsc1?.disconnect();
        this.padOsc2?.disconnect();
        this.textureOsc?.disconnect();
        
        this.isStarted = false;
      } catch (e) {
        console.error("Error stopping soundscape nodes:", e);
      }
    }, 1600);
  }
}

export const soundscape = typeof window !== "undefined" ? new AmbientSoundscapeEngine() : null;
