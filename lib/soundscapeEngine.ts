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
  
  // Drone Layer (Cozy low-frequency detuned TRIANGLE waves for warm felt grounding resonance - 100% clean)
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  
  // Pad Layer (Procedural 4-Voice Polyphonic Detuned TRIANGLE Synthesizer for warm, vintage pads)
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padOsc3: OscillatorNode | null = null;
  private padOsc4: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padPanner: StereoPannerNode | null = null;
  
  // Distant Star Harmonics (Ultra-quiet high-frequency sine anchor)
  private harmonicOsc: OscillatorNode | null = null;
  private harmonicGain: GainNode | null = null;
  private harmonicFilter: BiquadFilterNode | null = null;

  // Breathing Machine Hum (Soft 60Hz grounding analog electricity hum)
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;

  // Cozy Analog Air Pad (Replaces harsh pink noise completely with clean, high-frequency, wide stereo musical pads)
  private airPadOsc1: OscillatorNode | null = null;
  private airPadOsc2: OscillatorNode | null = null;
  private airPadGain: GainNode | null = null;
  private airPadFilter: BiquadFilterNode | null = null;
  private airPadPanner: StereoPannerNode | null = null;

  // LFOs for Evolving Resonance, Pacing, and Tape Drift
  private lfoFilter: OscillatorNode | null = null;
  private lfoPan: OscillatorNode | null = null;
  private lfoAir: OscillatorNode | null = null;
  private lfoHum: OscillatorNode | null = null;
  private lfoTapeDrift: OscillatorNode | null = null; // Slow pitch wobble LFO for vintage tape warmth

  // Subtle Cathedral Reverb Node Network (Schroeder Delay Loops for spatial depth)
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

    // --- 1. DRONE LAYER (Low-frequency cozy detuned TRIANGLE waves) ---
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    this.droneFilter = this.ctx.createBiquadFilter();

    // Detuned Triangle waves at F1 (43.65Hz) and C2 (65.4Hz - perfect 5th) for beautiful felt analog body hum
    this.droneOsc1.type = "triangle";
    this.droneOsc1.frequency.setValueAtTime(43.65, t);
    
    this.droneOsc2.type = "triangle";
    this.droneOsc2.frequency.setValueAtTime(65.40, t);

    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.setValueAtTime(75, t); // Warm lowpass cut
    this.droneFilter.Q.setValueAtTime(1.0, t);

    this.droneGain.gain.setValueAtTime(0.065, t); // Subtle felt grounding rumble

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain!);

    // --- 2. CHORUS-DETUNED POLYPHONIC PAD LAYER (Warm analog sweeps) ---
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padOsc3 = this.ctx.createOscillator();
    this.padOsc4 = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    this.padFilter = this.ctx.createBiquadFilter();
    this.padPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    // Cozy Triangle waves instead of harsh sines, detuned slightly (+/- 2 cents) for vintage chorus vibe
    this.padOsc1.type = "triangle";
    this.padOsc2.type = "triangle";
    this.padOsc3.type = "triangle";
    this.padOsc4.type = "triangle";

    // Warm, comforting A Major 9 Chord (Root, 3rd, 5th, 9th)
    this.padOsc1.frequency.setValueAtTime(220.00, t); // A3
    this.padOsc2.frequency.setValueAtTime(277.18, t); // C#4
    this.padOsc3.frequency.setValueAtTime(329.63, t); // E4
    this.padOsc4.frequency.setValueAtTime(493.88, t); // B4

    this.padFilter.type = "lowpass";
    this.padFilter.frequency.setValueAtTime(220, t); // Cinematic low-cutoff sweep
    this.padFilter.Q.setValueAtTime(1.2, t);

    this.padGain.gain.setValueAtTime(0.06, t); // Quiet atmospheric blend

    this.padOsc1.connect(this.padFilter);
    this.padOsc2.connect(this.padFilter);
    this.padOsc3.connect(this.padFilter);
    this.padOsc4.connect(this.padFilter);

    if (this.padPanner) {
      this.padFilter.connect(this.padPanner);
      this.padPanner.connect(this.padGain);
      this.padPanner.pan.setValueAtTime(-0.15, t);
    } else {
      this.padFilter.connect(this.padGain);
    }

    this.padGain.connect(this.masterGain!);

    // --- 3. COZY ANALOG AIR PAD LAYER (100% clean wide stereo synth air - NO HISS) ---
    this.airPadOsc1 = this.ctx.createOscillator();
    this.airPadOsc2 = this.ctx.createOscillator();
    this.airPadGain = this.ctx.createGain();
    this.airPadFilter = this.ctx.createBiquadFilter();
    this.airPadPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    this.airPadOsc1.type = "triangle";
    this.airPadOsc1.frequency.setValueAtTime(440.00, t); // A4 (High gorgeous fifth anchor)
    
    this.airPadOsc2.type = "triangle";
    this.airPadOsc2.frequency.setValueAtTime(659.25, t); // E5

    this.airPadFilter.type = "lowpass";
    this.airPadFilter.frequency.setValueAtTime(160, t); // Extremely dark lowpass filter to make it pure, lush air
    this.airPadFilter.Q.setValueAtTime(0.7, t);

    this.airPadGain.gain.setValueAtTime(0.045, t); // Gentle spacious cushion

    this.airPadOsc1.connect(this.airPadFilter);
    this.airPadOsc2.connect(this.airPadFilter);

    if (this.airPadPanner) {
      this.airPadFilter.connect(this.airPadPanner);
      this.airPadPanner.connect(this.airPadGain);
      this.airPadPanner.pan.setValueAtTime(0.25, t);
    } else {
      this.airPadFilter.connect(this.airPadGain);
    }
    this.airPadGain.connect(this.masterGain!);

    // --- 4. BREATHING MACHINE HUM (Cozy low electricity grounding hum - 100% clean) ---
    this.humOsc = this.ctx.createOscillator();
    this.humGain = this.ctx.createGain();
    this.humFilter = this.ctx.createBiquadFilter();

    this.humOsc.type = "triangle";
    this.humOsc.frequency.setValueAtTime(60.00, t); // Classic 60Hz grounding analog electricity hum

    this.humFilter.type = "lowpass";
    this.humFilter.frequency.setValueAtTime(60, t);
    this.humFilter.Q.setValueAtTime(0.7, t);

    this.humGain.gain.setValueAtTime(0.012, t); // Extremely faint machine presence

    this.humOsc.connect(this.humFilter);
    this.humFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain!);

    // --- 5. DISTANT STAR HARMONICS (Dreamy spacious high tone) ---
    this.harmonicOsc = this.ctx.createOscillator();
    this.harmonicGain = this.ctx.createGain();
    this.harmonicFilter = this.ctx.createBiquadFilter();

    this.harmonicOsc.type = "sine";
    this.harmonicOsc.frequency.setValueAtTime(329.63, t); // Dreamy E4 star chime

    this.harmonicFilter.type = "lowpass";
    this.harmonicFilter.frequency.setValueAtTime(330, t);
    this.harmonicFilter.Q.setValueAtTime(0.7, t);

    this.harmonicGain.gain.setValueAtTime(0.003, t); // Barely audible anchor

    this.harmonicOsc.connect(this.harmonicFilter);
    this.harmonicFilter.connect(this.harmonicGain);
    this.harmonicGain.connect(this.masterGain!);

    // --- 6. MOTION INTERACTION LFOS (Respiration, orbital panning, and tape drift) ---
    this.lfoFilter = this.ctx.createOscillator();
    this.lfoPan = this.ctx.createOscillator();
    this.lfoAir = this.ctx.createOscillator();
    this.lfoHum = this.ctx.createOscillator();
    this.lfoTapeDrift = this.ctx.createOscillator();

    this.lfoFilter.frequency.setValueAtTime(0.038, t); // Very slow 26s pad sweeping cycle
    this.lfoPan.frequency.setValueAtTime(0.018, t);    // Ultra slow 55s orbital panning cycle
    this.lfoAir.frequency.setValueAtTime(0.048, t);    // Slow 20s organic breeze respiration
    this.lfoHum.frequency.setValueAtTime(0.075, t);    // Slow 13s machine hum breathing
    this.lfoTapeDrift.frequency.setValueAtTime(0.15, t); // Beautiful slow 6.6s vintage pitch glide cycle

    // Pan pad layer slowly left-to-right
    if (this.padPanner) {
      const panGain = this.ctx.createGain();
      panGain.gain.setValueAtTime(0.40, t); // Soft orbital spread
      this.lfoPan.connect(panGain);
      panGain.connect(this.padPanner.pan);
    }

    // Cozy Air Pad LFO - sweep air lowpass cutoff slowly to mimic deep, quiet respiratory lung expansion
    const airLfoGain = this.ctx.createGain();
    airLfoGain.gain.setValueAtTime(45, t); // Sweep air lowpass range between 115Hz and 205Hz
    this.lfoAir.connect(airLfoGain);
    airLfoGain.connect(this.airPadFilter.frequency);

    // Pad LFO - sweep pad lowpass filter frequency for breath sweeps
    const padLfoGain = this.ctx.createGain();
    padLfoGain.gain.setValueAtTime(50, t); // Sweep pad filter range
    this.lfoFilter.connect(padLfoGain);
    padLfoGain.connect(this.padFilter.frequency);

    // Hum LFO - modulate machine hum volume gently to resemble mechanical respiration
    const humLfoGain = this.ctx.createGain();
    humLfoGain.gain.setValueAtTime(0.005, t); // Micro volume breath oscillations
    this.lfoHum.connect(humLfoGain);
    humLfoGain.connect(this.humGain.gain);

    // Tape Drift LFO - float pad voice pitches very gently (+/- 3 cents) to create warm analog vinyl drift
    const driftGain = this.ctx.createGain();
    driftGain.gain.setValueAtTime(0.85, t); // Freq shift multiplier
    this.lfoTapeDrift.connect(driftGain);
    
    // Connect pitch drift to all pad voices
    driftGain.connect(this.padOsc1.frequency);
    driftGain.connect(this.padOsc2.frequency);
    driftGain.connect(this.padOsc3.frequency);
    driftGain.connect(this.padOsc4.frequency);
    driftGain.connect(this.airPadOsc1.frequency);

    // --- 7. CATHEDRAL REVERB DECAY PATH (Atmospheric acoustics) ---
    this.reverbDelay1 = this.ctx.createDelay(1.0);
    this.reverbDelay2 = this.ctx.createDelay(1.0);
    this.reverbDelay3 = this.ctx.createDelay(1.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbFilter = this.ctx.createBiquadFilter();

    // Spatially wide delay reflections (23ms, 37ms, 59ms)
    this.reverbDelay1.delayTime.setValueAtTime(0.023, t);
    this.reverbDelay2.delayTime.setValueAtTime(0.037, t);
    this.reverbDelay3.delayTime.setValueAtTime(0.059, t);

    this.reverbFilter.type = "lowpass";
    this.reverbFilter.frequency.setValueAtTime(550, t); // Extremely dark cathedral reflection cutoff
    this.reverbFilter.Q.setValueAtTime(0.7, t);

    this.reverbGain.gain.setValueAtTime(0.065, t); // Warm, spacious, comfortable space tail

    // Feed pad synths, air pads, and star harmonics into Cathedral space
    this.padFilter.connect(this.reverbFilter);
    this.airPadFilter.connect(this.reverbFilter);
    this.harmonicFilter.connect(this.reverbFilter);

    // Form feedback loop
    this.reverbFilter.connect(this.reverbDelay1);
    this.reverbDelay1.connect(this.reverbDelay2);
    this.reverbDelay2.connect(this.reverbDelay3);
    this.reverbDelay3.connect(this.reverbFilter);

    this.reverbDelay3.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain!);

    // --- Start all nodes ---
    this.droneOsc1.start(t);
    this.droneOsc2.start(t);
    this.padOsc1.start(t);
    this.padOsc2.start(t);
    this.padOsc3.start(t);
    this.padOsc4.start(t);
    this.harmonicOsc.start(t);
    this.humOsc.start(t);
    
    this.airPadOsc1.start(t);
    this.airPadOsc2.start(t);

    this.lfoFilter.start(t);
    this.lfoPan.start(t);
    this.lfoAir.start(t);
    this.lfoHum.start(t);
    this.lfoTapeDrift.start(t);

    // Smoothly swell master soundscape volume over 4.5s for emotional impact
    this.masterGain!.gain.linearRampToValueAtTime(0.70, t + 4.5);
    
    // Set initial emotional chords
    this.updateEmotion(this.currentEmotion, this.isDemoModeActive);
  }

  public updateEmotion(emotion: string, isDemoMode = false) {
    this.currentEmotion = emotion as SoundscapeEmotion;
    this.isDemoModeActive = isDemoMode;
    
    if (!this.ctx || !this.isStarted) return;
    
    const t = this.ctx.currentTime;
    const fadeTime = 4.0; // Extra slow, comforting 4-second crossfades between emotions
    
    // Deep cinema detuned chord allocations
    let f1 = 220.00; // Root pad frequency
    let f2 = 277.18;
    let f3 = 329.63;
    let f4 = 493.88;

    const demoMultiplier = isDemoMode ? 1.20 : 1.0;

    switch (emotion) {
      case "calm":
        // Cozy, sweet, warm A Major 9
        f1 = 220.00; // A3
        f2 = 277.18; // C#4
        f3 = 329.63; // E4
        f4 = 493.88; // B4
        
        this.droneGain?.gain.setTargetAtTime(0.065 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(70, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.07 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(240, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.045 * demoMultiplier, t, fadeTime);
        this.harmonicGain?.gain.setTargetAtTime(0.003, t, fadeTime);
        break;

      case "melancholic":
        // Cinematic, deep C Minor 9 (highly emotional)
        f1 = 130.81; // C3
        f2 = 155.56; // Eb3
        f3 = 196.00; // G3
        f4 = 293.66; // D4
        
        this.droneGain?.gain.setTargetAtTime(0.055 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(55, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.05 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(200, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.055 * demoMultiplier, t, fadeTime); // Wind pad swell
        this.harmonicGain?.gain.setTargetAtTime(0.005, t, fadeTime);
        break;

      case "anxious":
        // Grounding, stabilizing, warm F Major 7
        f1 = 174.61; // F3
        f2 = 220.00; // A3
        f3 = 261.63; // C4
        f4 = 329.63; // E4
        
        this.droneGain?.gain.setTargetAtTime(0.08 * demoMultiplier, t, fadeTime); // Stable low grounding
        this.droneFilter?.frequency.setTargetAtTime(50, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.04 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(170, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.030, t, fadeTime);
        this.harmonicGain?.gain.setTargetAtTime(0.002, t, fadeTime);
        break;

      case "reflective":
        // Dreamy, floating suspended A sus2 / sus4 drift
        f1 = 220.00; // A3
        f2 = 246.94; // B3
        f3 = 329.63; // E4
        f4 = 587.33; // D5
        
        this.droneGain?.gain.setTargetAtTime(0.06 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(65, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.08 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(270, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.05 * demoMultiplier, t, fadeTime);
        this.harmonicGain?.gain.setTargetAtTime(0.004, t, fadeTime);
        break;

      case "playful":
      case "excited":
        // Soft positive G Major 9
        f1 = 196.00; // G3
        f2 = 246.94; // B3
        f3 = 293.66; // D4
        f4 = 440.00; // A4
        
        this.droneGain?.gain.setTargetAtTime(0.045 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(75, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.08 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(300, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.04 * demoMultiplier, t, fadeTime);
        this.harmonicGain?.gain.setTargetAtTime(0.003, t, fadeTime);
        break;

      case "lonely":
        // Isolated, spacious, highly comforting E minor 11
        f1 = 164.81; // E3
        f2 = 196.00; // G3
        f3 = 293.66; // D4
        f4 = 440.00; // A4
        
        this.droneGain?.gain.setTargetAtTime(0.06 * demoMultiplier, t, fadeTime);
        this.droneFilter?.frequency.setTargetAtTime(60, t, fadeTime);
        
        this.padGain?.gain.setTargetAtTime(0.05 * demoMultiplier, t, fadeTime);
        this.padFilter?.frequency.setTargetAtTime(210, t, fadeTime);
        
        this.airPadGain?.gain.setTargetAtTime(0.055 * demoMultiplier, t, fadeTime);
        this.harmonicGain?.gain.setTargetAtTime(0.006, t, fadeTime);
        break;

      default:
        break;
    }

    // Procedurally glide pad voices to new chord over 4 seconds
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
        this.harmonicOsc?.stop();
        this.humOsc?.stop();
        this.airPadOsc1?.stop();
        this.airPadOsc2?.stop();
        
        this.lfoFilter?.stop();
        this.lfoPan?.stop();
        this.lfoAir?.stop();
        this.lfoHum?.stop();
        this.lfoTapeDrift?.stop();
        
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.padOsc1?.disconnect();
        this.padOsc2?.disconnect();
        this.padOsc3?.disconnect();
        this.padOsc4?.disconnect();
        this.harmonicOsc?.disconnect();
        this.humOsc?.disconnect();
        this.airPadOsc1?.disconnect();
        this.airPadOsc2?.disconnect();

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
