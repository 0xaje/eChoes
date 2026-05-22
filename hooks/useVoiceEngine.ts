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

  useEffect(() => {
    emotionRef.current = currentEmotion;
    voiceRef.current = currentVoice;
  }, [currentEmotion, currentVoice]);

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
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
      // Auto-restart if engine is active and we are in listening mode
      if (isEngineActiveRef.current && stateRef.current === "listening") {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already active
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

    setState("thinking");
    setTranscript(messageText);

    try {
      // Append user message to history
      const userMessage: Message = { role: "user", content: messageText };
      const updatedHistory = [...history, userMessage];
      setHistory(updatedHistory);

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
      if (audioRef.current) {
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

    setState("listening");

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

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition already running.", e);
      }
    }
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

    stopWithFadeOut(() => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

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
