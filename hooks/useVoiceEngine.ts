"use client";

import { useEffect, useRef, useState } from "react";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";
import { getPauseParameters } from "@/lib/emotionalPauseEngine";

// Declare global types for webkitSpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export type VoiceState = "idle" | "listening" | "reflecting" | "thinking" | "speaking";

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
  const { emotion: currentEmotion, activeParams, updateEmotion } = useEmotionFlow();
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
  const networkRetryCountRef = useRef(0);
  const isNetworkRecoveringRef = useRef(false);
  const isSpeechRecognitionRunningRef = useRef(false);

  // Ref synchronizers to ensure web Speech API always reads fresh states
  const emotionRef = useRef<string>("calm");
  const voiceRef = useRef<string>("Bella");
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTtsTextRef = useRef<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeParamsRef = useRef(activeParams);

  useEffect(() => {
    activeParamsRef.current = activeParams;
  }, [activeParams]);

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

  // Real-time smooth sliding of filter frequency and volume from the emotion flow lerp brain
  useEffect(() => {
    try {
      const audioContext = audioContextRef.current;
      const synthFilter = synthFilterRef.current;
      const synthGain = synthGainRef.current;
      if (!audioContext || !synthFilter || !synthGain || !isEngineActive) return;

      const now = audioContext.currentTime;
      synthFilter.frequency.cancelScheduledValues(now);
      synthFilter.frequency.linearRampToValueAtTime(activeParams.droneFilterFrequency, now + 0.15);

      // Only adjust drone volume if not currently in ducked state
      if (state !== "listening" && state !== "thinking") {
        synthGain.gain.cancelScheduledValues(now);
        synthGain.gain.linearRampToValueAtTime(activeParams.droneVolume, now + 0.2);
      }
    } catch (e) {}
  }, [activeParams.droneFilterFrequency, activeParams.droneVolume, isEngineActive, state]);

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
      } else if (state === "reflecting") {
        // Soften ambient drone volume to 0.02 during reflection hesitation
        synthGain.gain.linearRampToValueAtTime(0.02, now + 0.6);
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

  // Speech Recognition Lifecycle Controller: Instantiates a fresh instance when listening, stops when speaking/thinking
  useEffect(() => {
    if (isEngineActive && state === "listening") {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
  }, [isEngineActive, state]);

  // Warm up speechSynthesis voices to ensure they are fully populated in browser cache
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
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
    utteranceRef.current = utterance; // Keep a strong reference to prevent garbage collection!
    
    // Choose high-quality voice depending on personality
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
    const candidateVoices = englishVoices.length > 0 ? englishVoices : voices;
    
    let selectedVoice = null;

    const isFemaleKeyword = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes("female") || 
             lower.includes("woman") || 
             lower.includes("girl") || 
             lower.includes("zira") || 
             lower.includes("samantha") || 
             lower.includes("karen") || 
             lower.includes("veena") || 
             lower.includes("moira") || 
             lower.includes("tessa") || 
             lower.includes("susan") || 
             lower.includes("hazel") || 
             lower.includes("rachel") || 
             lower.includes("bella");
    };

    const isMaleKeyword = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes("male") || 
             lower.includes("man") || 
             lower.includes("boy") || 
             lower.includes("david") || 
             lower.includes("antoni") || 
             lower.includes("george") || 
             lower.includes("ravi") || 
             lower.includes("daniel") ||
             lower.includes("guy") ||
             lower.includes("pete");
    };

    if (voiceRef.current === "Bella") {
      // Bella - Warm feminine (prefer US English female voice first)
      const usFemale = candidateVoices.find(v => (v.lang.toLowerCase().startsWith("en-us") || v.lang.toLowerCase().startsWith("en_us")) && isFemaleKeyword(v.name));
      selectedVoice = usFemale || candidateVoices.find(v => isFemaleKeyword(v.name));
      if (!selectedVoice) {
        // Fallback: any voice that is not explicitly male
        selectedVoice = candidateVoices.find(v => !isMaleKeyword(v.name));
      }
    } else if (voiceRef.current === "Rachel") {
      // Rachel - Elegant futuristic (prefer UK English female voice first)
      const ukFemale = candidateVoices.find(v => (v.lang.toLowerCase().startsWith("en-gb") || v.lang.toLowerCase().startsWith("en_gb")) && isFemaleKeyword(v.name));
      selectedVoice = ukFemale || candidateVoices.find(v => isFemaleKeyword(v.name));
      if (!selectedVoice) {
        // Fallback: any voice that is not explicitly male
        selectedVoice = candidateVoices.find(v => !isMaleKeyword(v.name));
      }
    } else {
      // Antoni - Masculine
      const anyMale = candidateVoices.find(v => isMaleKeyword(v.name));
      selectedVoice = anyMale || candidateVoices.find(v => {
        const lower = v.name.toLowerCase();
        return !isFemaleKeyword(lower);
      });
    }

    // Absolute fallback
    if (!selectedVoice && candidateVoices.length > 0) {
      selectedVoice = candidateVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🗣️ WebSpeech selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    }
    
    // Adjust pitch and rate depending on smoothly lerping emotion flow parameters
    utterance.rate = activeParamsRef.current.voiceSpeechRate;
    utterance.pitch = activeParamsRef.current.voiceSpeechPitch;
    
    utterance.onstart = () => {
      setState("speaking");
      simulateVisualizerSpeech();
    };
    
    utterance.onend = () => {
      utteranceRef.current = null;
      stopSimulatedVisualizer();
      setAiTranscript("");
      setTranscript("");
      setState("listening");
    };

    utterance.onerror = () => {
      utteranceRef.current = null;
      stopSimulatedVisualizer();
      setState("listening");
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

  // Resilient Fresh-Instance Speech Recognition Manager
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    if (isSpeechRecognitionRunningRef.current) {
      console.log("🎙️ Speech Recognition is already running. Skipping start request.");
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn("🎙️ Browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("🎙️ Fresh Speech Recognition started successfully.");
      isSpeechRecognitionRunningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      // Interruption Check: If the AI is speaking, interrupt instantly!
      if (stateRef.current === "speaking") {
        console.log("⚡ Interruption detected! Halting AI playback.");
        handleInterruption();
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      // Loop from 0 to capture full accumulated transcript in the current listening session
      for (let i = 0; i < event.results.length; ++i) {
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
      const errorType = event.error;
      isSpeechRecognitionRunningRef.current = false;
      
      if (errorType !== "no-speech" && errorType !== "aborted") {
        console.warn("🎙️ Speech Recognition error event:", errorType);
      }

      if (errorType === "not-allowed") {
        setIsEngineActive(false);
        setState("idle");
      }
    };

    recognition.onend = () => {
      console.log("🎙️ Speech Recognition instance ended.");
      isSpeechRecognitionRunningRef.current = false;
      
      // Auto-restart with safe 100ms browser cooldown delay if we are supposed to be actively listening
      if (isEngineActiveRef.current && stateRef.current === "listening") {
        console.log("🔄 Auto-restarting Speech Recognition to keep session alive.");
        setTimeout(() => {
          if (isEngineActiveRef.current && stateRef.current === "listening" && !isSpeechRecognitionRunningRef.current) {
            try {
              recognition.start();
              isSpeechRecognitionRunningRef.current = true;
            } catch (e) {
              console.warn("🎙️ Failed to auto-restart recognition in delayed retry:", e);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      isSpeechRecognitionRunningRef.current = true;
    } catch (e) {
      console.error("🎙️ Failed to start Speech Recognition instance:", e);
      isSpeechRecognitionRunningRef.current = false;
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        // Null out callbacks to prevent side-effects during async browser teardown
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        console.log("🔇 Stale Speech Recognition instance stopped cleanly.");
      } catch (e) {}
      recognitionRef.current = null;
      isSpeechRecognitionRunningRef.current = false;
    }
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
    };

    audio.onerror = (e) => {
      console.warn("⚠️ ElevenLabs audio stream load failed. Falling back to native browser speech synthesis.", e);
      stopAudioAnalysis();
      if (pendingTtsTextRef.current) {
        speakWithNativeTTS(pendingTtsTextRef.current);
        pendingTtsTextRef.current = ""; // Flush the ref
      } else {
        setState("listening");
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

    if (!isAwakening) {
      setTranscript(messageText);
      setState("reflecting");
      stateRef.current = "reflecting";

      // Compute pause engine delays based on active emotion
      const pauseParams = getPauseParameters(currentEmotion as any);
      await new Promise((resolve) => setTimeout(resolve, pauseParams.preResponseDelayMs));

      // Guard check: if the user clicked or interrupted reflection, abort dialogue generation
      if (stateRef.current !== "reflecting") return;
    } else {
      setTranscript(""); // Keep user input transcript blank during cinematic wake sequence
    }

    setState("thinking");
    stateRef.current = "thinking";

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
      updateEmotion(emotionalState as any);
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
        pendingTtsTextRef.current = replyText; // Store for fallback recovery
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
  function handleInterruption() {
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
  }

  // Text input keyboard fallback (bypasses microphone for non-speech environments)
  function submitTextInput(text: string) {
    if (!text || !text.trim() || !isEngineActiveRef.current) return;
    
    // Interruption cleanup if speaking
    if (stateRef.current === "speaking") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopSimulatedVisualizer();
      stopWithFadeOut(() => {
        stopAudioAnalysis();
        setAiTranscript("");
      });
    }

    setTranscript(text.trim());
    processConversation(text.trim());
  };

  // Launch Engine
  const startEngine = async () => {
    if (isEngineActive) return;

    setIsEngineActive(true);
    isEngineActiveRef.current = true;

    // Initialize DOM APIs dynamically on client action
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
            updateEmotion(data.emotion as any);
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
    isNetworkRecoveringRef.current = false;

    stopSpeechRecognition();

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
    submitTextInput,
    // Add memory/personality metrics to return signature
    sessionId,
    currentEmotion,
    currentVoice,
    recentMemories,
    updateVoice,
    setEmotion: updateEmotion,
  };
}
