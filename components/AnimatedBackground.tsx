"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";

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

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const { activeParams } = useEmotionFlow();
  
  const activeParamsRef = useRef(activeParams);

  useEffect(() => {
    activeParamsRef.current = activeParams;
  }, [activeParams]);

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

    // Initialize particles using unified lerped values (highly subtle)
    const createParticle = (initY = false): Particle => {
      const params = activeParamsRef.current;
      
      const x = Math.random() * window.innerWidth;
      const y = initY ? Math.random() * window.innerHeight : window.innerHeight + 10;
      const size = Math.random() * 1.1 + 0.3; // Smaller, finer dust
      
      const speedY = -(Math.random() * 0.15 + 0.04) * params.particleBaseSpeed;
      const speedX = (Math.random() - 0.5) * 0.06 * params.particleBaseSpeed;
      
      const opacity = Math.random() * 0.12 + 0.03; // Extremely dim
      
      const randomHue = params.particleColorRange[0] + Math.random() * (params.particleColorRange[1] - params.particleColorRange[0]);
      const hslColor = `hsla(${randomHue}, 40%, 65%, ${opacity})`; // Highly desaturated

      return { x, y, size, speedY, speedX, opacity, fadeSpeed: 0.001, color: hslColor };
    };

    // Populate initially
    for (let i = 0; i < 35; i++) {
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

        // Extremely light mouse dispersion
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 2400;
            p.x -= dx * force; 
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.y < -10 || p.x < -10 || p.x > window.innerWidth + 10) {
          particles[idx] = createParticle();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Compute dynamic HSL auras with extremely low saturation and contrast (Step 1)
  const baseHue = (activeParams.particleColorRange[0] + activeParams.particleColorRange[1]) / 2;
  const colors = [
    `hsla(${activeParams.particleColorRange[0]}, 40%, 20%, 0.20)`,
    `hsla(${baseHue}, 35%, 16%, 0.16)`,
    `hsla(${activeParams.particleColorRange[1]}, 35%, 12%, 0.14)`
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020204] -z-50 pointer-events-none">
      {/* Exquisite Grain Noise */}
      <div className="noise-overlay opacity-30" />

      {/* Drifting Aura spheres with liquid blending (highly desaturated and dim, 50% slower) */}
      <div className="absolute inset-0 opacity-20 mix-blend-screen filter blur-[135px] pointer-events-none">
        <motion.div
          animate={{
            x: ["0%", "8%", "-6%", "0%"],
            y: ["0%", "-8%", "8%", "0%"],
          }}
          transition={{
            duration: 52, // 50% slower
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
            x: ["0%", "-10%", "8%", "0%"],
            y: ["0%", "8%", "-10%", "0%"],
          }}
          transition={{
            duration: 60, // 50% slower
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
            x: ["0%", "6%", "-8%", "0%"],
            y: ["0%", "10%", "-6%", "0%"],
          }}
          transition={{
            duration: 46, // 50% slower
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[28%] left-[40%] w-[42vw] h-[42vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 80%)`,
          }}
        />
      </div>

      {/* Fine stardust particles overlay (ultra desaturated ghost dust) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-20" />
    </div>
  );
}
