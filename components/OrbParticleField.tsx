"use client";

import { useEffect, useRef } from "react";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";

interface OrbParticleFieldProps {
  state: "listening" | "thinking" | "speaking" | "idle" | "reflecting";
  volume?: number; // Normalized RMS amplitude (0.0 to 1.0)
  audioLevels?: number[]; // Full FFT frequency data
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
  decay: number;
  angle?: number;
  angleSpeed?: number;
  radialDist?: number;
  radialSpeed?: number;
  isSwarmBurst?: boolean; // Special flag to identify reactive speech burst particles
}

export default function OrbParticleField({
  state,
  volume = 0,
  audioLevels = [],
}: OrbParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { activeParams } = useEmotionFlow();

  // Use refs to track reactive values inside the high-performance animation loop
  const stateRef = useRef(state);
  const volumeRef = useRef(volume);
  const audioLevelsRef = useRef(audioLevels);
  const activeParamsRef = useRef(activeParams);
  const prevVolumeRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    volumeRef.current = volume;
    audioLevelsRef.current = audioLevels;
    activeParamsRef.current = activeParams;
  }, [state, volume, audioLevels, activeParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI retina screens
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Active particle array
    let particles: Particle[] = [];

    // Get color profile based on active emotional state range
    const getParticleColor = (hueRange: [number, number], opacity: number) => {
      const hue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);
      return `hsla(${hue}, 95%, 65%, ${opacity})`;
    };

    // Main particle generator inside the physics loop
    const spawnParticle = (cx: number, cy: number, vol: number) => {
      const params = activeParamsRef.current;
      if (particles.length >= params.particleMaxCount) return;

      const angle = Math.random() * Math.PI * 2;
      
      const speedMultiplier = params.particleBaseSpeed * (1.0 + vol * 0.8);
      const baseSize = 2 + Math.random() * 3;
      
      // Calculate decay rate based on preset limits
      const decayRate = params.particleDecayMin + Math.random() * (params.particleDecayMax - params.particleDecayMin);

      // Origin radius starts at edge of inner orb core (~60px to 80px)
      const originDist = 45 + Math.random() * 25;
      const spawnX = cx + Math.cos(angle) * originDist;
      const spawnY = cy + Math.sin(angle) * originDist;

      // Base radial velocity
      const vx = Math.cos(angle) * speedMultiplier;
      const vy = Math.sin(angle) * speedMultiplier;

      const p: Particle = {
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        size: baseSize,
        opacity: 0.1, // Fade in initially
        life: 1.0,
        maxLife: 1 / decayRate,
        color: "", // Will be dynamically computed based on opacity
        decay: decayRate,
      };

      // Add special emotional orbit parameters
      if (params.particleOrbit) {
        p.angle = angle;
        p.angleSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.015);
        p.radialDist = originDist;
        p.radialSpeed = 0.45 + Math.random() * 0.45;
      }

      particles.push(p);
    };

    // SWARM BURST MODE: Spawns an energetic cluster of particles exploding radially from the core
    const triggerSwarmBurst = (cx: number, cy: number, vol: number) => {
      const params = activeParamsRef.current;

      let particleCount = 10;
      let speedMultiplier = 1.0;
      let sizeFactor = 1.0;

      // Map audio volume to burst properties (Step 3)
      if (vol > 0.4) {
        // High volume / emotional speech explosion
        particleCount = Math.floor(35 + Math.random() * 20);
        speedMultiplier = 3.8 + Math.random() * 2.2;
        sizeFactor = 1.8;
      } else if (vol > 0.15) {
        // Medium volume radial burst
        particleCount = Math.floor(18 + Math.random() * 12);
        speedMultiplier = 2.0 + Math.random() * 1.0;
        sizeFactor = 1.3;
      } else {
        // Low volume subtle ripple
        particleCount = Math.floor(6 + Math.random() * 6);
        speedMultiplier = 1.0 + Math.random() * 0.5;
        sizeFactor = 0.85;
      }

      // Step 6: Safe peak pooling (cap total particles and trim old ones)
      if (particles.length + particleCount > 400) {
        particles = particles.slice(particleCount);
      }

      for (let i = 0; i < particleCount; i++) {
        // Full 360-degree angular dispersion (Step 2)
        const angle = Math.random() * Math.PI * 2;
        const initialSpeed = speedMultiplier * (0.85 + Math.random() * 0.4);
        
        const vx = Math.cos(angle) * initialSpeed;
        const vy = Math.sin(angle) * initialSpeed;

        // Decay over 800ms - 2000ms (Step 2)
        const decayRate = 0.008 + Math.random() * 0.012; 
        const baseSize = (1.5 + Math.random() * 3.5) * sizeFactor;

        particles.push({
          x: cx,
          y: cy,
          vx,
          vy,
          size: baseSize,
          opacity: 1.0, // Swarm burst starts fully luminous
          life: 1.0,
          maxLife: 1 / decayRate,
          color: "",
          decay: decayRate,
          isSwarmBurst: true
        });
      }
    };

    // Core Animation Frame Loop
    const draw = () => {
      if (!ctx || !canvas) return;

      const params = activeParamsRef.current;
      const currentVolume = volumeRef.current;
      const currentState = stateRef.current;
      const prevVolume = prevVolumeRef.current;

      const cx = width / 2;
      const cy = height / 2;

      // Premium Trail Effect: Clear with slight opacity transparent black to draw cosmic trails
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(3, 3, 3, 0.22)"; // Matching taskra cinematic deep black
      ctx.fillRect(0, 0, width, height);

      // Set global composite to screen for glowing additive flares
      ctx.globalCompositeOperation = "screen";

      // --- Trigger Swarm Bursts reactive to real-time speech triggers ---
      if (currentState === "speaking" || currentState === "listening") {
        // Speech onset trigger (Step 1)
        if (currentVolume >= 0.05 && prevVolume < 0.05) {
          triggerSwarmBurst(cx, cy, currentVolume * 1.5);
          console.log(`💥 Speech Swarm Burst triggered! RMS: ${currentVolume.toFixed(3)}`);
        }
        
        // Continuous syllable-responsive bursts
        if (currentVolume >= 0.05 && Math.random() < 0.25) {
          triggerSwarmBurst(cx, cy, currentVolume);
        }
      }

      prevVolumeRef.current = currentVolume;

      // Spawn Rate: Dynamic based on voice volume + state
      let spawnChance = params.particleSpawnChance; // Idle ambient spawning
      if (currentState === "reflecting") {
        spawnChance = 0; // Completely silence new spawns during conscious reflection pause
      } else if (currentState === "speaking") {
        spawnChance = params.particleSpawnChance * 1.5 + currentVolume * 1.5; // High output when AI talks
      } else if (currentState === "listening") {
        spawnChance = params.particleSpawnChance * 1.1 + currentVolume * 1.2; // Spawning tracks user voice frequency
      }

      // Roll chance
      if (Math.random() < spawnChance) {
        const spawns = Math.ceil(spawnChance);
        for (let s = 0; s < spawns; s++) {
          spawnParticle(cx, cy, currentVolume);
        }
      }

      // Physics update and draw loop
      particles.forEach((p) => {
        // Decrease life
        p.life -= p.decay;

        let currentOpacity = 0;
        let activeScale = p.size;

        if (p.isSwarmBurst) {
          // Swarm burst fade profile (direct linear decay)
          currentOpacity = p.life * 0.95;
          // Apply sparse dims to lonely state
          if (params.particleMaxCount < 50) {
            currentOpacity *= 0.6;
          }

          p.color = getParticleColor(params.particleColorRange, Math.max(0, Math.min(1, currentOpacity)));

          // Radial explosion movement + optional anxious jitter (Step 4)
          if (params.particleJitter > 1.0) {
            p.vx += (Math.random() - 0.5) * params.particleJitter * 0.15;
            p.vy += (Math.random() - 0.5) * params.particleJitter * 0.15;
          }
          if (currentState === "reflecting") {
            p.vx *= 0.80; // Rapidly decelerate swarm burst sparks
            p.vy *= 0.80;
          }
          p.x += p.vx;
          p.y += p.vy;

          // Gentle gravity drift if specified
          if (params.particleGravity > 0) {
            p.vy += params.particleGravity * 0.5;
          }

          // Energetic outward scaling
          activeScale *= 1.0 + p.life * 0.5;
        } else {
          // Standard ambient particle opacity fade-in phase
          if (p.life > 0.85) {
            currentOpacity = ((1.0 - p.life) / 0.15) * 0.8;
          } else {
            currentOpacity = (p.life / 0.85) * 0.8;
          }

          // Boost opacity when volume swells
          if (currentState === "speaking" || currentState === "listening") {
            currentOpacity *= 1.0 + currentVolume * 0.6;
          }

          p.color = getParticleColor(params.particleColorRange, Math.max(0, Math.min(1, currentOpacity)));

          // Movement Physics based on unified flow presets
          if (params.particleOrbit && p.angle !== undefined && p.angleSpeed !== undefined && p.radialDist !== undefined && p.radialSpeed !== undefined) {
            // Circular vortex/orbit physics
            const rotSlow = currentState === "reflecting" ? 0.30 : 1.0;
            p.angle += p.angleSpeed * rotSlow;
            p.radialDist += p.radialSpeed * rotSlow;
            p.x = cx + Math.cos(p.angle) * p.radialDist;
            p.y = cy + Math.sin(p.angle) * p.radialDist;

            // Gentle outward draft drift
            p.radialDist += 0.3 * rotSlow;
          } else {
            // Normal radial movement + jitter + gravity
            const driftSlow = currentState === "reflecting" ? 0.30 : 1.0;
            if (params.particleJitter > 0) {
              p.x += (p.vx + (Math.random() - 0.5) * params.particleJitter) * driftSlow;
              p.y += (p.vy + (Math.random() - 0.5) * params.particleJitter) * driftSlow;
            } else {
              p.x += p.vx * driftSlow;
              p.y += p.vy * driftSlow;
            }

            if (params.particleGravity > 0) {
              p.vy += params.particleGravity * driftSlow; // Downward pull
            }
          }

          // Dynamic scale breathing based on state
          if (currentState === "speaking" || currentState === "listening") {
            activeScale *= 1.0 + currentVolume * 0.45;
          }
        }

        // Draw particle
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, activeScale * 2.2);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, activeScale * 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Keep only active elements
      particles = particles.filter((p) => p.life > 0);

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute w-full h-full inset-0 pointer-events-none"
      style={{ mixBlendMode: "screen", zIndex: 0 }}
    />
  );
}
