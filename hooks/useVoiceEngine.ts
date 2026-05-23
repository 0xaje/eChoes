"use client";

import { useEffect, useRef, useState } from "react";

// Declare global types for webkitSpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useVoiceEngine() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(24).fill(0));
  const [averageAmplitude, setAverageAmplitude] = useState(0);
  const [history, setHistory] = useState<Message[]>([]);
  const [isEngineActive, setIsEngineActive] = useState(false);

  // Emotional Memory & Presence additions
  const [sessionId, setSessionId] = useState<string>("");
  const [currentEmotion, setCurrentEmotion] = useState<string>("calm");
  const [currentVoice, setCurrentVoice] = useState<string>("Bella");
  const [recentMemories, setRecentMemories] = useState<any[]>([]);

  // Core references
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Track state in refs to avoid closure stale values in event handlers
  const stateRef = useRef<VoiceState>("idle");
  const historyRef = useRef<Message[]>([]);
  const isEngineActiveRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref synchronizers to ensure web Speech API always reads fresh states
  const emotionRef = useRef<string>("calm");
  const voiceRef = useRef<string>("Bella");
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesizer Engine References for Cinematic Atmospheric Drone
  const subOscRef = useRef<OscillatorNode | null>(null);
  const padOscRef = useRef<OscillatorNode | null>(null);
  const synthFilterRef = useRef<BiquadFilterNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    emotionRef.current = currentEmotion;
    voiceRef.current = currentVoice;
  }, [currentEmotion, currentVoice]);

  // Trigger soundscape emotional modulation
  useEffect(() => {
    if (isEngineActive) {
      modulateAtmosphericDrone(currentEmotion);
    }
  }, [currentEmotion, isEngineActive]);

  // Duck synth drone volume when user is speaking to optimize recognition clarity
  useEffect(() => {
    try {
      const audioContext = audioContextRef.current;
      const synthGain = synthGainRef.current;
      if (!audioContext || !synthGain) return;

      const now = audioContext.currentTime;
      synthGain.gain.cancelScheduledValues(now);
      
      if (state === "listening") {
        // Muffle and duck slightly so mic recognition is perfect
        synthGain.gain.linearRampToValueAtTime(0.04, now + 0.8);
      } else if (state === "thinking") {
        // Swell up during thinking state to create anticipatory tension/warmth
        synthGain.gain.linearRampToValueAtTime(0.24, now + 1.2);
      } else if (state === "speaking") {
        // Return to standard volume behind the assistant's voice
        synthGain.gain.linearRampToValueAtTime(0.14, now + 1.0);
      } else { // idle
        // Silent
        synthGain.gain.linearRampToValueAtTime(0, now + 1.0);
      }
    } catch (e) {}
  }, [state]);

  // Initialize Session ID and Voice client-side to prevent hydration mismatches
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("echoes_session_id");
      if (!id) {
        id = "session_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("echoes_session_id", id);
      }
      setSessionId(id);

      const savedVoice = localStorage.getItem("echoes_current_voice");
      if (savedVoice) {
        setCurrentVoice(savedVoice);
      }
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    isEngineActiveRef.current = isEngineActive;
  }, [isEngineActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopEngine();
    };
  }, []);

  // Update selected voice and persist it
  const updateVoice = (voice: string) => {
    setCurrentVoice(voice);
    if (typeof window !== "undefined") {
      localStorage.setItem("echoes_current_voice", voice);
    }
    console.log(`🎤 Voice personality switched to: ${voice}`);
  };

  // Get dynamic human silence timeout threshold based on emotion (Step 2)
  const getSilenceThreshold = (emo: string): number => {
    switch (emo) {
      case "reflective":
      case "melancholic":
        return 1600; // 1.6s longer contemplation pause to let user reflect
      case "lonely":
        return 1500; // 1.5s gentle turn-taking
      case "anxious":
        return 1400; // 1.4s comfortable, calming slow timing
      case "excited":
      case "playful":
        return 800;  // 0.8s rapid responsiveness matching excited tempo
      case "calm":
      default:
        return 1100; // 1.1s standard balanced rhythm
    }
  };

  // Audio Mastering helper: Smooth fade-in gain ramping (Step 8)
  const playWithFadeIn = async () => {
    if (!audioRef.current) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    audioRef.current.volume = 0; // Start silent to avoid pop
    try {
      await audioRef.current.play();

      let vol = 0;
      fadeIntervalRef.current = setInterval(() => {
        if (!audioRef.current) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          return;
        }
        vol = Math.min(1.0, vol + 0.1);
        audioRef.current.volume = vol;
        if (vol >= 1.0) {
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
        }
      }, 15); // Fully faded in over 150ms
    } catch (e) {
      console.warn("Autoplay block or playback interrupted:", e);
    }
  };

  // Audio Mastering helper: Anti-click fade-out gain ramping (Step 8)
  const stopWithFadeOut = (callback: () => void) => {
    if (!audioRef.current || audioRef.current.paused) {
      callback();
      return;
    }

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    let vol = audioRef.current.volume;
    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        callback();
        return;
      }
      vol = Math.max(0, vol - 0.15); // Rapid volume ramp down
      audioRef.current.volume = vol;
      if (vol <= 0) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        audioRef.current.pause();
        audioRef.current.src = ""; // Flush buffer
        callback();
      }
    }, 10); // Ramp down complete in 70ms-100ms
  };

  const speakWithNativeTTS = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    // Stop speech recognition while speaking to prevent self-interruption feedback loop
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose high-quality voice depending on personality
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (voiceRef.current === "Bella") {
      // Warm feminine
      selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Zira") || v.lang.startsWith("en-US"));
    } else if (voiceRef.current === "Rachel") {
      // Elegant futuristic
      selectedVoice = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Hazel") || v.lang.startsWith("en-GB"));
    } else {
      // Antoni - Reassuring masculine
      selectedVoice = voices.find(v => v.name.includes("Google US English Male") || v.name.includes("David") || (v.lang.startsWith("en-US") && v.name.includes("Male")));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Adjust pitch and rate depending on emotion
    if (emotionRef.current === "excited" || emotionRef.current === "playful") {
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
    } else if (emotionRef.current === "melancholic" || emotionRef.current === "lonely") {
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
    } else if (emotionRef.current === "reflective") {
      utterance.rate = 0.9;
      utterance.pitch = 0.98;
    } else if (emotionRef.current === "anxious") {
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
    } else {
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
    }
    
    utterance.onstart = () => {
      setState("speaking");
      simulateVisualizerSpeech();
    };
    
    utterance.onend = () => {
      stopSimulatedVisualizer();
      setAiTranscript("");
      setTranscript("");
      setState("listening");
      if (isEngineActiveRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    utterance.onerror = () => {
      stopSimulatedVisualizer();
      setState("listening");
      if (isEngineActiveRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const simulateVisualizerSpeech = () => {
    if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    
    visualizerIntervalRef.current = setInterval(() => {
      const levels = Array.from({ length: 24 }, () => Math.floor(Math.random() * 85) + 15);
      // Give it a speech-like envelope with a center bias
      const centerBiasedLevels = levels.map((val, idx) => {
        const dist = Math.abs(idx - 12);
        const factor = Math.max(0.1, 1 - dist / 12);
        return Math.floor(val * factor * (Math.random() * 0.5 + 0.75));
      });
      setAudioLevels(centerBiasedLevels);
      
      const total = centerBiasedLevels.reduce((a, b) => a + b, 0);
      setAverageAmplitude((total / (24 * 255)) * 1.8);
    }, 90);
  };

  const stopSimulatedVisualizer = () => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    setAudioLevels(new Array(24).fill(0));
    setAverageAmplitude(0);
  };

  // Real-time atmospheric drone synthesizer
  const startAtmosphericDrone = () => {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      // Stop existing nodes if already active
      stopAtmosphericDrone();

      // Master Synthesizer Gain Node (for startup fade-in / ducking / shutdown)
      const synthGain = audioContext.createGain();
      synthGain.gain.setValueAtTime(0, audioContext.currentTime);
      synthGain.connect(audioContext.destination);
      synthGainRef.current = synthGain;

      // Resonant Lowpass Filter to keep tones warm, dark, and sub-bass focused
      const synthFilter = audioContext.createBiquadFilter();
      synthFilter.type = "lowpass";
      synthFilter.frequency.setValueAtTime(140, audioContext.currentTime);
      synthFilter.Q.setValueAtTime(1.5, audioContext.currentTime);
      synthFilter.connect(synthGain);
      synthFilterRef.current = synthFilter;

      // Deep Sub-Bass Oscillator
      const subOsc = audioContext.createOscillator();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(55, audioContext.currentTime); // 55Hz - A1 sub-tone
      subOsc.connect(synthFilter);
      subOsc.start();
      subOscRef.current = subOsc;

      // Soft Harmonic Triangle Pad (adds rich ambient texture)
      const padOsc = audioContext.createOscillator();
      padOsc.type = "triangle";
      padOsc.frequency.setValueAtTime(110, audioContext.currentTime); // 110Hz - A2 harmonic
      
      const padGain = audioContext.createGain();
      padGain.gain.setValueAtTime(0.35, audioContext.currentTime);
      padOsc.connect(padGain);
      padGain.connect(synthFilter);
      padOsc.start();
      padOscRef.current = padOsc;

      // Low-Frequency Oscillator (LFO) for breathing, liquid modulation
      const lfo = audioContext.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.08, audioContext.currentTime); // 1 cycle per 12.5 seconds

      const lfoGain = audioContext.createGain();
      lfoGain.gain.setValueAtTime(25, audioContext.currentTime); // Shift cutoff by +/- 25Hz

      lfo.connect(lfoGain);
      lfoGain.connect(synthFilter.frequency);
      lfo.start();
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;

      // Smoothly swell master drone volume over 3 seconds
      synthGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 3.0);
      console.log("🌌 Atmospheric synthesizer drone activated.");
    } catch (e) {
      console.warn("Failed to initialize Web Audio drone:", e);
    }
  };

  const stopAtmosphericDrone = () => {
    try {
      const audioContext = audioContextRef.current;
      const synthGain = synthGainRef.current;

      if (synthGain && audioContext) {
        // Smoothly fade out drone volume over 1.2 seconds to prevent audio pops
        synthGain.gain.cancelScheduledValues(audioContext.currentTime);
        synthGain.gain.setValueAtTime(synthGain.gain.value, audioContext.currentTime);
        synthGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.2);
      }

      setTimeout(() => {
        if (subOscRef.current) {
          try { subOscRef.current.stop(); } catch (e) {}
          subOscRef.current.disconnect();
          subOscRef.current = null;
        }
        if (padOscRef.current) {
          try { padOscRef.current.stop(); } catch (e) {}
          padOscRef.current.disconnect();
          padOscRef.current = null;
        }
        if (lfoRef.current) {
          try { lfoRef.current.stop(); } catch (e) {}
          lfoRef.current.disconnect();
          lfoRef.current = null;
        }
        if (lfoGainRef.current) {
          lfoGainRef.current.disconnect();
          lfoGainRef.current = null;
        }
        if (synthFilterRef.current) {
          synthFilterRef.current.disconnect();
          synthFilterRef.current = null;
        }
        if (synthGainRef.current) {
          synthGainRef.current.disconnect();
          synthGainRef.current = null;
        }
      }, 1300);
    } catch (e) {}
  };

  const modulateAtmosphericDrone = (emotion: string) => {
    try {
      const audioContext = audioContextRef.current;
      const synthFilter = synthFilterRef.current;
      const subOsc = subOscRef.current;
      const padOsc = padOscRef.current;
      const synthGain = synthGainRef.current;

      if (!audioContext || !synthFilter || !synthGain) return;

      const now = audioContext.currentTime;

      // Cancel pending values
      synthFilter.frequency.cancelScheduledValues(now);
      synthGain.gain.cancelScheduledValues(now);
      if (subOsc) subOsc.frequency.cancelScheduledValues(now);
      if (padOsc) padOsc.frequency.cancelScheduledValues(now);

      switch (emotion) {
        case "melancholic":
        case "lonely":
          // Deep, soothing womb-like sub-drone (A1/A2 octaves, low cutoff)
          synthFilter.frequency.exponentialRampToValueAtTime(110, now + 4.0);
          synthGain.gain.linearRampToValueAtTime(0.24, now + 3.0);
          if (subOsc) subOsc.frequency.exponentialRampToValueAtTime(55, now + 3.0);
          if (padOsc) padOsc.frequency.exponentialRampToValueAtTime(110, now + 3.0);
          break;

        case "anxious":
          // Extremely warm, comforting, highly muffled drone to steady heartbeat
          synthFilter.frequency.exponentialRampToValueAtTime(95, now + 4.0);
          synthGain.gain.linearRampToValueAtTime(0.15, now + 3.0);
          if (subOsc) subOsc.frequency.exponentialRampToValueAtTime(55, now + 3.0);
          if (padOsc) padOsc.frequency.exponentialRampToValueAtTime(110, now + 3.0);
          break;

        case "excited":
        case "playful":
          // Bright, warm major-interval shift (C2/C3 pitches, higher cutoff)
          synthFilter.frequency.exponentialRampToValueAtTime(260, now + 4.0);
          synthGain.gain.linearRampToValueAtTime(0.16, now + 3.0);
          if (subOsc) subOsc.frequency.exponentialRampToValueAtTime(65.4, now + 4.0);
          if (padOsc) padOsc.frequency.exponentialRampToValueAtTime(130.8, now + 4.0);
          break;

        case "reflective":
          // Resonant PERFECT FIFTH chord drone (A1 and E3 pitches)
          synthFilter.frequency.exponentialRampToValueAtTime(190, now + 4.0);
          synthGain.gain.linearRampToValueAtTime(0.20, now + 3.0);
          if (subOsc) subOsc.frequency.exponentialRampToValueAtTime(55, now + 3.0);
          if (padOsc) padOsc.frequency.exponentialRampToValueAtTime(164.8, now + 4.0);
          break;

        case "calm":
        default:
          // Standard balanced drone
          synthFilter.frequency.exponentialRampToValueAtTime(140, now + 4.0);
          synthGain.gain.linearRampToValueAtTime(0.18, now + 3.0);
          if (subOsc) subOsc.frequency.exponentialRampToValueAtTime(55, now + 3.0);
          if (padOsc) padOsc.frequency.exponentialRampToValueAtTime(110, now + 3.0);
          break;
      }
    } catch (e) {}
  };

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn("Browser does not support Speech Recognition. Use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started.");
      if (stateRef.current === "idle" || stateRef.current === "speaking") {
        setState("listening");
      }
    };

    recognition.onresult = (event: any) => {
      // Interruption Check: If the AI is speaking and we detect user speech, interrupt instantly!
      if (stateRef.current === "speaking" && audioRef.current) {
        console.log("⚡ Interruption detected! Halting AI playback.");
        handleInterruption();
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeTranscript = finalTranscript || interimTranscript;
      if (activeTranscript.trim()) {
        setTranscript(activeTranscript);
      }

      // Reset silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // If user stops speaking, set a timeout to process dialogue
      if (stateRef.current === "listening" && finalTranscript.trim()) {
        const threshold = getSilenceThreshold(emotionRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          processConversation(finalTranscript.trim());
        }, threshold);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === "not-allowed") {
        setIsEngineActive(false);
        setState("idle");
      } else if (event.error === "network") {
        console.warn("Speech recognition cloud connection offline. Scheduling automatic connection recovery in 2 seconds...");
        setTimeout(() => {
          if (isEngineActiveRef.current && (stateRef.current === "listening" || stateRef.current === "idle")) {
            try {
              recognitionRef.current.start();
              console.log("⚡ Auto-recovered speech recognition network tunnel successfully.");
            } catch (e) {}
          }
        }, 2000);
      } else if (event.error === "aborted") {
        console.log("Speech recognition aborted. Ready to resume.");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
      // Auto-restart if engine is active and we are in listening or transition phases
      if (isEngineActiveRef.current && (stateRef.current === "listening" || stateRef.current === "idle")) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Backoff retry in 1 second if context lock was active
          setTimeout(() => {
            if (isEngineActiveRef.current && stateRef.current === "listening") {
              try {
                recognitionRef.current.start();
              } catch (err) {}
            }
          }, 1000);
        }
      }
    };

    recognitionRef.current = recognition;
  };

  // Initialize browser Web Audio APIs for real-time FFT visual analysis
  const initAudioEngine = () => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    
    // Bind HTML speaking status directly to visual states
    audio.onplay = () => {
      setState("speaking");
      startAudioAnalysis();
    };

    audio.onended = () => {
      stopAudioAnalysis();
      setAiTranscript("");
      setTranscript("");
      setState("listening");

      // Restart Speech Recognition if inactive
      if (isEngineActiveRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };

    audioRef.current = audio;
  };

  // Real-time FFT analysis loop
  const startAudioAnalysis = () => {
    if (typeof window === "undefined" || !audioRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 64; // Small size for responsive visualizer bars
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);

        // Step 3: Subtle cathedral room acoustics reverb (Delay-based spatial tail)
        const voiceDelay = audioContext.createDelay(1.0);
        const voiceReverbGain = audioContext.createGain();
        const voiceFilter = audioContext.createBiquadFilter();

        voiceDelay.delayTime.setValueAtTime(0.045, audioContext.currentTime); // 45ms soft tail reflection
        voiceFilter.type = "lowpass";
        voiceFilter.frequency.setValueAtTime(850, audioContext.currentTime); // Dark reflection filter cutoff
        voiceFilter.Q.setValueAtTime(0.7, audioContext.currentTime);

        voiceReverbGain.gain.setValueAtTime(0.06, audioContext.currentTime); // Cinematic, highly restrained space gain

        // Connect parallel spatial reflection path
        source.connect(voiceFilter);
        voiceFilter.connect(voiceDelay);
        voiceDelay.connect(voiceReverbGain);
        voiceReverbGain.connect(audioContext.destination);
      }

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (stateRef.current !== "speaking") return;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Map frequencies to our 24 visualizer bars
        const levels: number[] = [];
        let total = 0;

        for (let i = 0; i < 24; i++) {
          const dataIdx = Math.floor((i / 24) * bufferLength);
          const val = dataArray[dataIdx] || 0;
          levels.push(val);
          total += val;
        }

        setAudioLevels(levels);
        setAverageAmplitude(total / (24 * 255)); // Normalized amplitude scale (0 - 1)
      };

      draw();
    } catch (e) {
      console.warn("Could not construct Web Audio graph:", e);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevels(new Array(24).fill(0));
    setAverageAmplitude(0);
  };

  // Perform conversational round-trip: Speech -> text -> OpenAI -> dbSave -> tts stream
  const processConversation = async (messageText: string) => {
    if (!messageText.trim()) return;

    const isAwakening = messageText === "[AWAKENING]";

    setState("thinking");
    if (!isAwakening) {
      setTranscript(messageText);
    } else {
      setTranscript(""); // Keep user input transcript blank during cinematic wake sequence
    }

    try {
      let updatedHistory = history;
      if (!isAwakening) {
        const userMessage: Message = { role: "user", content: messageText };
        updatedHistory = [...history, userMessage];
        setHistory(updatedHistory);
      }

      // 1. Fetch conversational routing (mood-aware & memory-injected)
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: updatedHistory.slice(-6), // Send last 6 turns as visual conversation history
          sessionId,
          voice: currentVoice,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Chat request failed.");
      }

      const chatData = await chatResponse.json();
      const replyText = chatData.text;
      const emotionalState = chatData.emotion;
      const distilledMemory = chatData.distilledMemory;

      // 2. Reactively evolve emotional states globally
      setCurrentEmotion(emotionalState);
      console.log(`🧠 [VoiceEngine] Emotion Detected: ${emotionalState}`);

      if (distilledMemory) {
        setRecentMemories((prev) => {
          const exists = prev.some((m) => m.memory_text === distilledMemory);
          if (exists) return prev;
          return [
            {
              id: Math.random().toString(),
              memory_text: distilledMemory,
            },
            ...prev,
          ].slice(0, 8); // Keep top 8 visible
        });
      }

      // Append assistant message to history
      const assistantMessage: Message = { role: "assistant", content: replyText };
      setHistory((prev) => [...prev, assistantMessage]);
      setAiTranscript(replyText);

      // 3. Load ElevenLabs TTS audio stream directly into audio element with active voice selection
      if (chatData.isSimulated) {
        speakWithNativeTTS(replyText);
      } else if (audioRef.current) {
        audioRef.current.src = `/api/tts?text=${encodeURIComponent(replyText)}&voice=${currentVoice}&emotion=${emotionalState}`;
        audioRef.current.load();
        
        // Wait for autoplay approval with smooth gain ramp-up
        try {
          await playWithFadeIn();
        } catch (e) {
          console.warn("Autoplay block. Waiting for user gesture.", e);
          setState("speaking");
        }
      }
    } catch (error) {
      console.error("Dialogue cycle failed:", error);
      setTranscript("");
      setAiTranscript("Forgive me, I lost the connection...");
      setState("listening");

      // Auto-restart listening
      if (isEngineActiveRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  };

  // Interruption Handling: Fade out audio, flush, and resume listening turn (Step 8)
  const handleInterruption = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopSimulatedVisualizer();
    stopWithFadeOut(() => {
      stopAudioAnalysis();
      setAiTranscript("");
      setTranscript("");
      
      // Set status to listening so the user can speak immediately
      setState("listening");
      console.log("⚡ Interrupt success. Echoes halted and listening.");
    });
  };

  // Launch Engine
  const startEngine = async () => {
    if (isEngineActive) return;

    setIsEngineActive(true);
    isEngineActiveRef.current = true;

    // Initialize DOM APIs dynamically on client action
    if (!recognitionRef.current) initSpeechRecognition();
    if (!audioRef.current) initAudioEngine();

    // Step 4: Cinematic Awakening Sequence - set to thinking to morph centerpiece orb
    setState("thinking");

    // Fetch initial profile & memories asynchronously to resume atmospheric mood
    if (sessionId) {
      try {
        const response = await fetch(`/api/session?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.emotion) {
            setCurrentEmotion(data.emotion);
            console.log(`🌌 Atmospheric mood resumed: ${data.emotion}`);
          }
          if (data.memories) {
            setRecentMemories(data.memories);
          }
        }
      } catch (e) {
        console.warn("Failed to retrieve preceding session context:", e);
      }
    }

    // Launch Web Audio synthesizer drone
    startAtmosphericDrone();

    // Step 4: Delay initial awakening greeting to let sub-bass drone and warm reverb swell first in silence
    setTimeout(() => {
      if (isEngineActiveRef.current) {
        processConversation("[AWAKENING]");
      }
    }, 1800);
  };

  // Shut down Engine
  const stopEngine = () => {
    setIsEngineActive(false);
    isEngineActiveRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Stop Web Audio drone
    stopAtmosphericDrone();

    stopWithFadeOut(() => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopSimulatedVisualizer();
      stopAudioAnalysis();
      setState("idle");
      setTranscript("");
      setAiTranscript("");
      setHistory([]);
    });
  };

  return {
    state,
    transcript,
    aiTranscript,
    audioLevels,
    averageAmplitude,
    history,
    isEngineActive,
    startEngine,
    stopEngine,
    handleInterruption,
    // Add memory/personality metrics to return signature
    sessionId,
    currentEmotion,
    currentVoice,
    recentMemories,
    updateVoice,
    setEmotion: setCurrentEmotion,
  };
}
