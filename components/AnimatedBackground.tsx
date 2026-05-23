"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
    switch (emo) {
      case "melancholic":
        return ["rgba(99, 102, 241, 0.22)", "rgba(129, 140, 248, 0.18)", "rgba(165, 180, 252, 0.12)"]; // Violet Indigo
      case "excited":
        return ["rgba(236, 72, 153, 0.35)", "rgba(244, 63, 94, 0.3)", "rgba(6, 182, 212, 0.35)"]; // Bright Cyan, Pink
      case "reflective":
        return ["rgba(16, 185, 129, 0.22)", "rgba(5, 150, 105, 0.18)", "rgba(110, 231, 183, 0.12)"]; // Teal/Green
      case "anxious":
        return ["rgba(217, 119, 6, 0.2)", "rgba(245, 158, 11, 0.15)", "rgba(148, 163, 184, 0.18)"]; // Warm Amber
      case "lonely":
        return ["rgba(59, 130, 246, 0.15)", "rgba(100, 116, 139, 0.15)", "rgba(148, 163, 184, 0.1)"]; // Misty Blue/Grey
      case "playful":
        return ["rgba(244, 63, 94, 0.3)", "rgba(245, 158, 11, 0.25)", "rgba(236, 72, 153, 0.25)"]; // Rose, Gold, Pink
      case "calm":
      default:
        if (vName === "Bella") {
          return ["rgba(139, 92, 246, 0.28)", "rgba(167, 139, 250, 0.18)", "rgba(216, 180, 254, 0.12)"]; // Violet
        } else if (vName === "Rachel") {
          return ["rgba(6, 182, 212, 0.28)", "rgba(34, 211, 238, 0.18)", "rgba(165, 243, 252, 0.12)"]; // Cyan
        } else {
          return ["rgba(59, 130, 246, 0.28)", "rgba(96, 165, 250, 0.18)", "rgba(191, 219, 254, 0.12)"]; // Blue
        }
    }
  };

  // Get particle speed multiplier based on emotional energy
  const getSpeedMultiplier = (emo: string): number => {
    switch (emo) {
      case "excited": return 1.6;
      case "playful": return 1.3;
      case "anxious": return 1.1;
      case "melancholic": return 0.5;
      case "reflective": return 0.6;
      case "lonely": return 0.45;
      case "calm":
      default: return 0.9;
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
      const size = Math.random() * (curEmo === "excited" ? 2.2 : 1.5) + 0.4;
      const speedY = -(Math.random() * 0.28 + 0.06) * speedMult;
      const speedX = (Math.random() - 0.5) * 0.1 * speedMult;
      const opacity = Math.random() * (curEmo === "lonely" ? 0.2 : 0.38) + 0.05;
      const fadeSpeed = Math.random() * 0.002 + 0.0008;
      const color = possibleColors[Math.floor(Math.random() * possibleColors.length)];

      return { x, y, size, speedY, speedX, opacity, fadeSpeed, color };
    };

    // Populate initially
    for (let i = 0; i < 45; i++) {
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

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Subtle mouse field interaction
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 1800;
            p.x -= dx * force; 
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = p.color;
        ctx.fill();

        if (p.y < -10 || p.x < -10 || p.x > window.innerWidth + 10) {
          particles[idx] = createParticle();
        }
      });

      ctx.shadowBlur = 0; 
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
        return ["rgba(49, 46, 129, 0.45)", "rgba(30, 41, 59, 0.5)", "rgba(17, 24, 39, 0.6)"]; // Deep Indigo Slate
      case "excited":
        return ["rgba(190, 24, 93, 0.45)", "rgba(217, 119, 6, 0.4)", "rgba(8, 145, 178, 0.4)"]; // Vivid Orchid/Cyan
      case "reflective":
        return ["rgba(15, 118, 110, 0.4)", "rgba(17, 94, 89, 0.45)", "rgba(6, 78, 59, 0.5)"]; // Emerald Green
      case "anxious":
        return ["rgba(217, 119, 6, 0.25)", "rgba(13, 148, 136, 0.25)", "rgba(30, 41, 59, 0.4)"]; // Reassuring Amber/Teal
      case "lonely":
        return ["rgba(23, 37, 84, 0.45)", "rgba(15, 23, 42, 0.5)", "rgba(30, 41, 59, 0.55)"]; // Moody Blue
      case "playful":
        return ["rgba(225, 29, 72, 0.45)", "rgba(234, 179, 8, 0.35)", "rgba(249, 115, 22, 0.4)"]; // Rose/Gold
      case "calm":
      default:
        if (vName === "Bella") {
          return ["rgba(124, 58, 237, 0.38)", "rgba(79, 70, 229, 0.32)", "rgba(219, 39, 119, 0.25)"]; // Premium Violet
        } else if (vName === "Rachel") {
          return ["rgba(6, 182, 212, 0.38)", "rgba(37, 99, 235, 0.32)", "rgba(112, 26, 117, 0.25)"]; // Crystal Cyan
        } else {
          return ["rgba(30, 58, 138, 0.45)", "rgba(3, 105, 161, 0.4)", "rgba(180, 83, 9, 0.25)"]; // Calm Blue/Amber
        }
    }
  };

  const colors = getAuraColors(emotion, voice);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#030307] -z-50 pointer-events-none">
      {/* 1. Fine grid network */}
      <div className="grid-overlay" />
      
      {/* 2. Exquisite Grain Noise */}
      <div className="noise-overlay" />

      {/* 3. Drifting Aura spheres with liquid blending */}
      <div className="absolute inset-0 opacity-55 mix-blend-screen filter blur-[125px] pointer-events-none">
        <motion.div
          animate={{
            x: ["0%", "12%", "-8%", "0%"],
            y: ["0%", "-12%", "12%", "0%"],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[8%] left-[15%] w-[48vw] h-[48vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors[0]} 0%, transparent 80%)`,
          }}
        />
        <motion.div
          animate={{
            x: ["0%", "-15%", "12%", "0%"],
            y: ["0%", "12%", "-15%", "0%"],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[8%] right-[12%] w-[52vw] h-[52vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors[1]} 0%, transparent 80%)`,
          }}
        />
        <motion.div
          animate={{
            x: ["0%", "8%", "-12%", "0%"],
            y: ["0%", "15%", "-8%", "0%"],
          }}
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[28%] left-[40%] w-[42vw] h-[42vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 80%)`,
          }}
        />
      </div>

      {/* 4. Fine stardust floating particles overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-65" />
    </div>
  );
}
