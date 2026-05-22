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
  
  // Drone Layer (Cinematic Low Hum - detuned pure sine frequencies for felt sub-bass resonance)
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  
  // Pad Layer (Procedural 4-Voice Polyphonic Synthesizer for sweet, soft cinematic chords)
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padOsc3: OscillatorNode | null = null;
  private padOsc4: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padPanner: StereoPannerNode | null = null;
  
  // Shimmer/Texture Layer (Airy high spacious frequency chimes/refractions)
  private textureOsc: OscillatorNode | null = null;
  private textureGain: GainNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;
  private texturePanner: StereoPannerNode | null = null;

  // LFOs for Evolving Motion
  private lfoFilter: OscillatorNode | null = null;
  private lfoPan: OscillatorNode | null = null;

  // Subtle Cathedral Reverb Node Network (Step 3: Atmospheric Space Resonance)
  private reverbDelay1: DelayNode | null = null;
  private reverbDelay2: DelayNode | null = null;
  private reverbDelay3: DelayNode | null = null;
  private reverbGain: GainNode | null = null;
  private reverbFilter: BiquadFilterNode | null = null;
  
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

    // --- 1. DEEP DRONE LAYER (Low-frequency cinematic sub-bass foundation) ---
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    this.droneFilter = this.ctx.createBiquadFilter();

    // 55Hz (A1) detuned A0 (27.5Hz) pure sine waves for felt sub-bass resonance rather than a harsh hum
    this.droneOsc1.type = "sine";
    this.droneOsc1.frequency.setValueAtTime(27.5, t);
    
    this.droneOsc2.type = "sine";
    this.droneOsc2.frequency.setValueAtTime(55, t);

    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.setValueAtTime(80, t); // Cinematic cutoff
    this.droneFilter.Q.setValueAtTime(1, t);

    this.droneGain.gain.setValueAtTime(0.32, t); // High volume but felt sub-bass

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain!);

    // --- 2. PROCEDURAL 4-VOICE POLYPHONIC PAD LAYER (Drifting chord presence) ---
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padOsc3 = this.ctx.createOscillator();
    this.padOsc4 = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    this.padFilter = this.ctx.createBiquadFilter();
    this.padPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    // Detuned Sine waves exclusive for a beautiful, soft, and cloud-like tone
    this.padOsc1.type = "sine";
    this.padOsc2.type = "sine";
    this.padOsc3.type = "sine";
    this.padOsc4.type = "sine";

    // Initialize with a warm A Major 9 chord (Root, 3rd, 5th, 9th)
    this.padOsc1.frequency.setValueAtTime(220.00, t); // A3
    this.padOsc2.frequency.setValueAtTime(277.18, t); // C#4
    this.padOsc3.frequency.setValueAtTime(329.63, t); // E4
    this.padOsc4.frequency.setValueAtTime(493.88, t); // B4

    this.padFilter.type = "lowpass";
    this.padFilter.frequency.setValueAtTime(350, t); // Ethereal low cut to keep it soft
    this.padFilter.Q.setValueAtTime(2, t);           // Ethereal resonance bump

    this.padGain.gain.setValueAtTime(0.09, t);

    this.padOsc1.connect(this.padFilter);
    this.padOsc2.connect(this.padFilter);
    this.padOsc3.connect(this.padFilter);
    this.padOsc4.connect(this.padFilter);

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
    this.textureFilter.frequency.setValueAtTime(659.25, t); // E4 chime resonance
    this.textureFilter.Q.setValueAtTime(3, t);

    this.textureGain.gain.setValueAtTime(0.01, t);

    this.textureOsc.connect(this.textureFilter);
    if (this.texturePanner) {
      this.textureFilter.connect(this.texturePanner);
      this.texturePanner.connect(this.textureGain);
      this.texturePanner.pan.setValueAtTime(0.6, t);
    } else {
      this.textureFilter.connect(this.textureGain);
    }
    this.textureGain.connect(this.masterGain!);

    // --- 4. MOTION INTERACTION LFOS (Continuous slow orbital drift) ---
    this.lfoFilter = this.ctx.createOscillator();
    this.lfoPan = this.ctx.createOscillator();

    this.lfoFilter.frequency.setValueAtTime(0.06, t); // Very slow 16s cycle
    this.lfoPan.frequency.setValueAtTime(0.03, t);    // Ultra slow 33s panning cycle

    // Connect LFO Pan to spatial panner
    if (this.padPanner) {
      const panGain = this.ctx.createGain();
      panGain.gain.setValueAtTime(0.75, t); // High pan width
      this.lfoPan.connect(panGain);
      panGain.connect(this.padPanner.pan);
    }

    // Connect LFO Filter to Pad Filter frequency to create breathing pad sweeps
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.setValueAtTime(70, t); // Cutoff sweep range +/- 70Hz
    this.lfoFilter.connect(filterLfoGain);
    filterLfoGain.connect(this.padFilter.frequency);

    // --- 5. SUBTLE CATHEDRAL REVERB SPACE (Step 3: Environmental Acoustics) ---
    this.reverbDelay1 = this.ctx.createDelay(1.0);
    this.reverbDelay2 = this.ctx.createDelay(1.0);
    this.reverbDelay3 = this.ctx.createDelay(1.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbFilter = this.ctx.createBiquadFilter();

    // Natural room reflection prime spacings (23ms, 37ms, 59ms)
    this.reverbDelay1.delayTime.setValueAtTime(0.023, t);
    this.reverbDelay2.delayTime.setValueAtTime(0.037, t);
    this.reverbDelay3.delayTime.setValueAtTime(0.059, t);

    // Dark lowpass filter on reverb loop to roll off high frequency metallic click echo
    this.reverbFilter.type = "lowpass";
    this.reverbFilter.frequency.setValueAtTime(750, t); // Warm, physical dark space tail
    this.reverbFilter.Q.setValueAtTime(0.7, t);

    // Reverb gain: cinematic, quiet, almost invisible tail
    this.reverbGain.gain.setValueAtTime(0.038, t);

    // Connect pad and shimmer filters to the Cathedral Reverb space
    this.padFilter.connect(this.reverbFilter);
    this.textureFilter.connect(this.reverbFilter);

    // Build the Schroeder feedback decay loop
    this.reverbFilter.connect(this.reverbDelay1);
    this.reverbDelay1.connect(this.reverbDelay2);
    this.reverbDelay2.connect(this.reverbDelay3);
    this.reverbDelay3.connect(this.reverbFilter); // feedback link

    this.reverbDelay3.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain!);

    // --- Start all nodes ---
    this.droneOsc1.start(t);
    this.droneOsc2.start(t);
    this.padOsc1.start(t);
    this.padOsc2.start(t);
    this.padOsc3.start(t);
    this.padOsc4.start(t);
    this.textureOsc.start(t);
    this.lfoFilter.start(t);
    this.lfoPan.start(t);

    // Smoothly fade in master soundscape volume to make launch spectacular
    this.masterGain!.gain.linearRampToValueAtTime(0.85, t + 4.5);
    
    // Apply baseline emotional weights
    this.updateEmotion(this.currentEmotion, this.isDemoModeActive);
  }

  public updateEmotion(emotion: string, isDemoMode = false) {
    this.currentEmotion = emotion as SoundscapeEmotion;
    this.isDemoModeActive = isDemoMode;
    
    if (!this.ctx || !this.isStarted) return;
    
    const t = this.ctx.currentTime;
    const fadeTime = 4.0; // Slow, organic, beautiful 4-second crossfade transitions
    
    // Target chord frequency allocations representing lush, sweet extensions
    let f1 = 220.00; // Root
    let f2 = 277.18; // 3rd
    let f3 = 329.63; // 5th
    let f4 = 493.88; // 9th or 7th

    const demoMultiplier = isDemoMode ? 1.45 : 1.0;

    switch (emotion) {
      case "calm":
        // Lush, sweet A Major 9
        f1 = 220.00; // A3
        f2 = 277.18; // C#4
        f3 = 329.63; // E4
        f4 = 493.88; // B4
        
        this.droneGain?.gain.setTargetAtTime(0.36 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(70, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.14 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(360, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.008 * demoMultiplier, t, fadeTime);
        break;

      case "melancholic":
        // Beautiful, emotional C Minor 9
        f1 = 130.81; // C3
        f2 = 155.56; // Eb3
        f3 = 196.00; // G3
        f4 = 293.66; // D4
        
        this.droneGain?.gain.setTargetAtTime(0.25 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(60, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.09 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(260, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.02 * demoMultiplier, t, fadeTime);
        break;

      case "anxious":
        // Grounding, comforting, deeply stabilizing F Major 7
        f1 = 174.61; // F3
        f2 = 220.00; // A3
        f3 = 261.63; // C4
        f4 = 329.63; // E4
        
        this.droneGain?.gain.setTargetAtTime(0.48 * demoMultiplier, t, fadeTime); // Grounding bass presence
        this.droneFilter?.frequency.setTargetAtTime(55, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.06 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(210, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.002, t, fadeTime);
        break;

      case "reflective":
        // Dreamy suspended A sus2 / sus4 drift
        f1 = 220.00; // A3
        f2 = 246.94; // B3
        f3 = 329.63; // E4
        f4 = 587.33; // D5 (evocative high extension)
        
        this.droneGain?.gain.setTargetAtTime(0.3 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(80, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.16 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(420, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.015 * demoMultiplier, t, fadeTime);
        break;

      case "playful":
      case "excited":
        // Active, bright G Major 9
        f1 = 196.00; // G3
        f2 = 246.94; // B3
        f3 = 293.66; // D4
        f4 = 440.00; // A4
        
        this.droneGain?.gain.setTargetAtTime(0.2 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(90, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.18 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(550, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.03 * demoMultiplier, t, fadeTime);
        break;

      case "lonely":
        // Isolated, floating, spacious E minor 11
        f1 = 164.81; // E3
        f2 = 196.00; // G3
        f3 = 293.66; // D4
        f4 = 440.00; // A4
        
        this.droneGain?.gain.setTargetAtTime(0.28 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(65, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.08 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(230, t, fadeTime);
        this.textureGain?.gain.setTargetAtTime(0.018 * demoMultiplier, t, fadeTime);
        break;

      default:
        break;
    }

    // Procedurally morph/glide the individual chord voice frequencies over 4 seconds
    this.padOsc1?.frequency.setTargetAtTime(f1, t, fadeTime);
    this.padOsc2?.frequency.setTargetAtTime(f2, t, fadeTime);
    this.padOsc3?.frequency.setTargetAtTime(f3, t, fadeTime);
    this.padOsc4?.frequency.setTargetAtTime(f4, t, fadeTime);
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
        this.padOsc3?.stop();
        this.padOsc4?.stop();
        this.textureOsc?.stop();
        this.lfoFilter?.stop();
        this.lfoPan?.stop();
        
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.padOsc1?.disconnect();
        this.padOsc2?.disconnect();
        this.padOsc3?.disconnect();
        this.padOsc4?.disconnect();
        this.textureOsc?.disconnect();

        this.reverbDelay1?.disconnect();
        this.reverbDelay2?.disconnect();
        this.reverbDelay3?.disconnect();
        this.reverbFilter?.disconnect();
        this.reverbGain?.disconnect();
        
        this.isStarted = false;
      } catch (e) {
        console.error("Error stopping soundscape nodes:", e);
      }
    }, 1600);
  }
}

export const soundscape = typeof window !== "undefined" ? new AmbientSoundscapeEngine() : null;
