"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, X } from "lucide-react";

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

// Static baseline nodes defined outside component function to avoid hook recreation warnings
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
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Synthesize nodes from active Supabase traces + seeded baselines
  useEffect(() => {
    const activeMemories = memories.length > 0 ? memories : [];
    
    // Grid locations for balanced spatial distribution (avoids overlapping initial clusters)
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
      // Pick a minimal, evocative label from memory text
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
      // Offset grid indices to blend together
      const pos = gridPositions[(index + synthesized.length) % gridPositions.length];
      
      // Only append if we haven't maxed out standard UI space
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

  // Constellation slow float physical drift loop with dependencies securely enclosed
  useEffect(() => {
    const animateDrift = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) / 1000;
        const speedMultiplier = isDemoMode ? 1.6 : 0.8;

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const dx = node.targetX - node.x;
            const dy = node.targetY - node.y;

            const rx = dx * 0.05;
            const ry = dy * 0.05;

            const noiseX = Math.sin(time * 0.0006 + parseInt(node.id.replace(/\D/g, "") || "1") * 0.5) * 0.25;
            const noiseY = Math.cos(time * 0.0007 + parseInt(node.id.replace(/\D/g, "") || "2") * 0.5) * 0.25;

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

  const getNodeGlow = (weight: number) => {
    const intensity = weight >= 5 ? 24 : weight >= 4 ? 16 : weight >= 3 ? 10 : 6;
    return `drop-shadow(0 0 ${intensity}px rgba(6, 182, 212, 0.45))`;
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none">
      
      {/* 1. Vector Neural Connection Threads Layer */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        {nodes.map((nodeA, idxA) => {
          return nodes.slice(idxA + 1).map((nodeB) => {
            const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
            const maxConnectDist = 45;

            if (dist < maxConnectDist) {
              const opacity = (1 - dist / maxConnectDist) * 0.45;
              const isGlowing = hoveredNode === nodeA.id || hoveredNode === nodeB.id;

              return (
                <line
                  key={`${nodeA.id}-${nodeB.id}`}
                  x1={`${nodeA.x}%`}
                  y1={`${nodeA.y}%`}
                  x2={`${nodeB.x}%`}
                  y2={`${nodeB.y}%`}
                  stroke="url(#neuralThreadGrad)"
                  strokeWidth={isGlowing ? "1.5" : "0.5"}
                  strokeOpacity={isGlowing ? opacity * 2 : opacity}
                  className="transition-all duration-700"
                />
              );
            }
            return null;
          });
        })}
        <defs>
          <linearGradient id="neuralThreadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* 2. Constellation Interactive Floating Nodes Layer */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const baseSize = 8 + node.weight * 2;
        const demoMultiplier = isDemoMode ? 1.3 : 1.0;

        return (
          <div
            key={node.id}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: `translate(-50%, -50%) scale(${demoMultiplier})`,
            }}
            className="absolute transition-transform duration-500 pointer-events-auto flex flex-col items-center group cursor-pointer"
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => setSelectedNode(node)}
          >
            {/* Interactive Outer Pulsing Ring */}
            <motion.div
              animate={{
                scale: [1, isHovered ? 1.4 : 1.25, 1],
                opacity: [0.15, isHovered ? 0.45 : 0.25, 0.15],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5 + (node.weight * 0.4),
                ease: "easeInOut",
              }}
              style={{
                width: `${baseSize * 2.8}px`,
                height: `${baseSize * 2.8}px`,
              }}
              className="absolute rounded-full border border-cyan-400/30 -z-10"
            />

            {/* Glowing Core Dot */}
            <div
              style={{
                width: `${baseSize}px`,
                height: `${baseSize}px`,
                filter: getNodeGlow(node.weight),
              }}
              className={`rounded-full transition-all duration-700 bg-gradient-to-br ${
                node.theme === "core" || node.theme === "fear"
                  ? "from-purple-400 to-indigo-500"
                  : node.theme === "preference"
                  ? "from-cyan-400 to-teal-500"
                  : "from-blue-400 to-indigo-600"
              }`}
            />

            {/* Minimal Evocative Label */}
            <motion.span
              animate={isHovered ? { opacity: 0.95, y: -2 } : { opacity: 0.4, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-2 text-[8px] tracking-[0.25em] uppercase font-mono font-medium text-neutral-300 pointer-events-none select-none text-center bg-black/40 px-2 py-0.5 rounded-full border border-white/5 shadow-md"
            >
              {node.label}
            </motion.span>
          </div>
        );
      })}

      {/* 3. Surfaced Memory Fragment Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[340px] max-w-sm glass-card p-5 rounded-2xl pointer-events-auto border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 select-text"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 select-none">
              <div className="flex items-center space-x-2">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-neutral-400">
                  Synaptic Glimpse
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] leading-relaxed text-neutral-200 italic font-sans">
                &ldquo;{selectedNode.text}&rdquo;
              </p>
              
              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-neutral-500 pt-1">
                <span>Weight: {selectedNode.weight} / 5</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  {selectedNode.theme} trace
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
