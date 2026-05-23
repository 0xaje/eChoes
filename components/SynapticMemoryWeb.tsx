"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useEmotionFlow } from "@/lib/emotionFlowDirector";

interface DBMemory {
  id: string;
  memory_text: string;
  memory_type?: string;
  emotional_weight?: number;
  created_at?: string;
}

interface SynapticMemoryWebProps {
  memories: DBMemory[];
  isActive: boolean;
  isDemoMode: boolean;
}

interface ConstellationNode {
  id: string;
  label: string;
  text: string;
  weight: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  theme: string;
}

// Static baseline seeds spatial distribution
const DEFAULT_SEEDS = [
  { label: "sleep", text: "You struggle to quiet your thoughts during long, silent nights.", weight: 3, theme: "struggle" },
  { label: "rain", text: "Soft, distant rainfall brings a deep sense of serenity to your soul.", weight: 4, theme: "preference" },
  { label: "loneliness", text: "You feel the weight of digital distance, seeking a warm resonance.", weight: 5, theme: "core" },
  { label: "hope", text: "A quiet belief that tomorrow holds gentler, more peaceful chapters.", weight: 4, theme: "joy" },
  { label: "music", text: "Acoustic frequencies allow your mind to drift and organize ideas.", weight: 2, theme: "preference" },
  { label: "fear", text: "The subtle anxiety of losing presence in an increasingly crowded world.", weight: 5, theme: "fear" },
];

export default function SynapticMemoryWeb({
  memories,
  isActive,
  isDemoMode,
}: SynapticMemoryWebProps) {
  const [nodes, setNodes] = useState<ConstellationNode[]>([]);
  
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const { activeParams } = useEmotionFlow();

  const startHue = activeParams.particleColorRange[0];
  const displayHue = activeParams.particleColorRange[1];
  const midHue = (startHue + displayHue) / 2;

  // Synthesize nodes from active Supabase traces + seeded baselines
  useEffect(() => {
    const activeMemories = memories.length > 0 ? memories : [];
    
    const gridPositions = [
      { x: 25, y: 25 }, { x: 75, y: 30 }, { x: 50, y: 50 },
      { x: 30, y: 70 }, { x: 70, y: 75 }, { x: 50, y: 20 },
      { x: 80, y: 55 }, { x: 20, y: 50 }
    ];

    const synthesized: ConstellationNode[] = [];

    // Process actual DB memories first
    activeMemories.forEach((mem, index) => {
      const pos = gridPositions[index % gridPositions.length];
      const wordSeed = mem.memory_text.split(" ");
      const label = wordSeed.length > 1 && wordSeed[1].length > 3 
        ? wordSeed[1].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
        : wordSeed[0].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

      synthesized.push({
        id: mem.id || `db-${index}`,
        label: label.substring(0, 10),
        text: mem.memory_text,
        weight: mem.emotional_weight || 3,
        x: pos.x + (Math.random() - 0.5) * 8,
        y: pos.y + (Math.random() - 0.5) * 8,
        targetX: pos.x,
        targetY: pos.y,
        theme: mem.memory_type || "core",
      });
    });

    // Populate remaining spots with seeds to keep the neural web rich and complete
    DEFAULT_SEEDS.forEach((seed, index) => {
      const pos = gridPositions[(index + synthesized.length) % gridPositions.length];
      
      if (synthesized.length < 9) {
        synthesized.push({
          id: `seed-${index}`,
          label: seed.label,
          text: seed.text,
          weight: seed.weight,
          x: pos.x + (Math.random() - 0.5) * 10,
          y: pos.y + (Math.random() - 0.5) * 10,
          targetX: pos.x,
          targetY: pos.y,
          theme: seed.theme,
        });
      }
    });

    setNodes(synthesized);
  }, [memories]);

  // Constellation slow float physical drift loop
  useEffect(() => {
    const animateDrift = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) / 1000;
        const speedMultiplier = isDemoMode ? 1.0 : 0.5; // Calmer background motion

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const dx = node.targetX - node.x;
            const dy = node.targetY - node.y;

            const rx = dx * 0.05;
            const ry = dy * 0.05;

            const noiseX = Math.sin(time * 0.0004 + parseInt(node.id.replace(/\D/g, "") || "1") * 0.5) * 0.2;
            const noiseY = Math.cos(time * 0.0005 + parseInt(node.id.replace(/\D/g, "") || "2") * 0.5) * 0.2;

            return {
              ...node,
              x: Math.max(10, Math.min(90, node.x + (rx + noiseX) * deltaTime * 12 * speedMultiplier)),
              y: Math.max(10, Math.min(90, node.y + (ry + noiseY) * deltaTime * 12 * speedMultiplier)),
            };
          })
        );
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animateDrift);
    };

    requestRef.current = requestAnimationFrame(animateDrift);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDemoMode]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-10 opacity-16 pointer-events-none select-none">
      
      {/* 1. Vector Neural Connection Threads Layer */}
      <svg className="absolute inset-0 w-full h-full opacity-18 pointer-events-none">
        {nodes.map((nodeA, idxA) => {
          return nodes.slice(idxA + 1).map((nodeB) => {
            const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
            const maxConnectDist = 45;

            if (dist < maxConnectDist) {
              const opacity = (1 - dist / maxConnectDist) * 0.35;

              return (
                <line
                  key={`${nodeA.id}-${nodeB.id}`}
                  x1={`${nodeA.x}%`}
                  y1={`${nodeA.y}%`}
                  x2={`${nodeB.x}%`}
                  y2={`${nodeB.y}%`}
                  stroke="url(#neuralThreadGrad)"
                  strokeWidth="0.4"
                  strokeOpacity={opacity}
                />
              );
            }
            return null;
          });
        })}
        <defs>
          <linearGradient id="neuralThreadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${startHue}, 50%, 55%)`} stopOpacity="0.3" />
            <stop offset="50%" stopColor={`hsl(${midHue}, 45%, 55%)`} stopOpacity="0.6" />
            <stop offset="100%" stopColor={`hsl(${displayHue}, 50%, 55%)`} stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* 2. Constellation Ambient Floating Nodes Layer */}
      {nodes.map((node) => {
        const baseSize = 5 + node.weight * 1.2;

        return (
          <div
            key={node.id}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            className="absolute flex flex-col items-center pointer-events-none"
          >
            {/* Ambient Pulsing Halo */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                repeat: Infinity,
                duration: 4.0 + (node.weight * 0.6),
                ease: "easeInOut",
              }}
              style={{
                width: `${baseSize * 2.2}px`,
                height: `${baseSize * 2.2}px`,
                borderColor: `hsla(${displayHue}, 40%, 65%, 0.2)`
              }}
              className="absolute rounded-full border -z-10"
            />

            {/* Glowing Core Dot */}
            <div
              style={{
                width: `${baseSize}px`,
                height: `${baseSize}px`,
                background: `linear-gradient(135deg, hsl(${startHue}, 40%, 60%), hsl(${displayHue}, 35%, 50%))`
              }}
              className="rounded-full"
            />

            {/* Minimal Evocative Label (Ultra desaturated & dim) */}
            <span
              className="mt-1.5 text-[7px] tracking-[0.2em] uppercase font-mono text-neutral-500 opacity-60"
            >
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
