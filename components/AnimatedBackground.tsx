"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
}

interface AnimatedBackgroundProps {
  emotion: string;
  voice: string;
}

export default function AnimatedBackground({ emotion = "calm", voice = "Bella" }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const emotionRef = useRef(emotion);
  const voiceRef = useRef(voice);

  useEffect(() => {
    emotionRef.current = emotion;
    voiceRef.current = voice;
  }, [emotion, voice]);

  // Map emotions to beautiful particle color sets
  const getParticleColors = (emo: string, vName: string): string[] => {
    // Base colors matching the voice if calm, otherwise emotional overlays
    switch (emo) {
      case "melancholic":
        return ["rgba(139, 92, 246, 0.3)", "rgba(79, 70, 229, 0.2)", "rgba(99, 102, 241, 0.2)"]; // Violet Indigo
      case "excited":
        return ["rgba(6, 182, 212, 0.4)", "rgba(236, 72, 153, 0.4)", "rgba(255, 255, 255, 0.3)"]; // Bright Cyan, Pink, White
      case "reflective":
        return ["rgba(245, 158, 11, 0.3)", "rgba(217, 119, 6, 0.2)", "rgba(255, 255, 255, 0.15)"]; // Gold, Amber, White
      case "anxious":
        return ["rgba(100, 116, 139, 0.2)", "rgba(148, 163, 184, 0.2)", "rgba(71, 85, 105, 0.3)"]; // Slate Gray/Blue
      case "lonely":
        return ["rgba(120, 119, 198, 0.15)", "rgba(75, 85, 99, 0.15)", "rgba(255, 255, 255, 0.1)"]; // Misty Grey/Indigo
      case "playful":
        return ["rgba(236, 72, 153, 0.35)", "rgba(244, 63, 94, 0.3)", "rgba(251, 191, 36, 0.25)"]; // Pink, Rose, Gold
      case "calm":
      default:
        // Calm defaults based on active voice personality
        if (vName === "Bella") {
          return ["rgba(168, 85, 247, 0.35)", "rgba(139, 92, 246, 0.25)", "rgba(255, 255, 255, 0.2)"]; // Violet
        } else if (vName === "Rachel") {
          return ["rgba(6, 182, 212, 0.35)", "rgba(14, 165, 233, 0.25)", "rgba(255, 255, 255, 0.2)"]; // Cyan
        } else {
          return ["rgba(59, 130, 246, 0.35)", "rgba(37, 99, 235, 0.25)", "rgba(245, 158, 11, 0.15)"]; // Antoni Deep Blue / Gold highlights
        }
    }
  };

  // Get particle speed multiplier based on emotional energy
  const getSpeedMultiplier = (emo: string): number => {
    switch (emo) {
      case "excited": return 1.8;
      case "playful": return 1.4;
      case "anxious": return 1.2;
      case "melancholic": return 0.55;
      case "reflective": return 0.65;
      case "lonely": return 0.45;
      case "calm":
      default: return 0.95;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const createParticle = (initY = false): Particle => {
      const curEmo = emotionRef.current;
      const curVoice = voiceRef.current;
      const speedMult = getSpeedMultiplier(curEmo);
      const possibleColors = getParticleColors(curEmo, curVoice);

      const x = Math.random() * window.innerWidth;
      const y = initY ? Math.random() * window.innerHeight : window.innerHeight + 10;
      const size = Math.random() * (curEmo === "excited" ? 2.5 : 1.8) + 0.5;
      const speedY = -(Math.random() * 0.35 + 0.08) * speedMult;
      const speedX = (Math.random() - 0.5) * 0.12 * speedMult;
      const opacity = Math.random() * (curEmo === "lonely" ? 0.3 : 0.45) + 0.08;
      const fadeSpeed = Math.random() * 0.002 + 0.0008;
      const color = possibleColors[Math.floor(Math.random() * possibleColors.length)];

      return { x, y, size, speedY, speedX, opacity, fadeSpeed, color };
    };

    // Populate initially
    for (let i = 0; i < 60; i++) {
      particles.push(createParticle(true));
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Dampen mouse movement
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      particles.forEach((p, idx) => {
        // Move particle
        p.y += p.speedY;
        p.x += p.speedX;

        // Mouse attraction/repulsion subtle field
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const force = (140 - dist) / 1400;
            p.x -= dx * force; // Push away gently
          }
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 1.8;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Respawn if out of bounds
        if (p.y < -10 || p.x < -10 || p.x > window.innerWidth + 10) {
          particles[idx] = createParticle();
        }
      });

      ctx.shadowBlur = 0; // Reset shadow for next render

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Map active emotion & voice to absolute CSS aura colors for beautiful gradients
  const getAuraColors = (emo: string, vName: string): string[] => {
    switch (emo) {
      case "melancholic":
        return ["rgba(139, 92, 246, 0.15)", "rgba(79, 70, 229, 0.15)", "rgba(99, 102, 241, 0.1)"]; // Violet Indigo
      case "excited":
        return ["rgba(6, 182, 212, 0.18)", "rgba(236, 72, 153, 0.18)", "rgba(255, 255, 255, 0.1)"]; // Bright Cyan, Pink, White
      case "reflective":
        return ["rgba(245, 158, 11, 0.12)", "rgba(217, 119, 6, 0.1)", "rgba(255, 255, 255, 0.06)"]; // Gold, Amber, White
      case "anxious":
        return ["rgba(100, 116, 139, 0.12)", "rgba(148, 163, 184, 0.12)", "rgba(71, 85, 105, 0.15)"]; // Slate Gray/Blue
      case "lonely":
        return ["rgba(120, 119, 198, 0.1)", "rgba(75, 85, 99, 0.1)", "rgba(255, 255, 255, 0.05)"]; // Misty Grey/Indigo
      case "playful":
        return ["rgba(236, 72, 153, 0.16)", "rgba(244, 63, 94, 0.15)", "rgba(251, 191, 36, 0.15)"]; // Pink, Rose, Gold
      case "calm":
      default:
        // Calm defaults based on active voice personality
        if (vName === "Bella") {
          return ["rgba(168, 85, 247, 0.15)", "rgba(139, 92, 246, 0.12)", "rgba(0, 241, 253, 0.08)"]; // Purple & Cyan glow
        } else if (vName === "Rachel") {
          return ["rgba(0, 241, 253, 0.15)", "rgba(164, 87, 194, 0.15)", "rgba(0, 55, 58, 0.1)"]; // Ethereal Cyan & Indigo (matches template)
        } else {
          return ["rgba(59, 130, 246, 0.15)", "rgba(37, 99, 235, 0.12)", "rgba(245, 158, 11, 0.08)"]; // Antoni Blue/Gold
        }
    }
  };

  const colors = getAuraColors(emotion, voice);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05060a] -z-50 pointer-events-none">
      {/* 1. Ambient Aurora Backdrop */}
      <div className="aurora-container">
        {/* Star Field layer */}
        <div className="star-field" />
        
        {/* Drifting radial-gradients overlay */}
        <div 
          className="aurora"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, ${colors[0]} 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, ${colors[1]} 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, ${colors[2]} 0%, transparent 60%)
            `
          }}
        />
      </div>

      {/* 2. Dynamic canvas floating particles overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
}
