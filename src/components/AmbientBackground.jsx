// src/components/AmbientBackground.jsx
import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function AmbientBackground({ variant = "default" }) {
  const { dark, theme } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Accent color parsing
    const accentColor = dark ? "123, 158, 255" : "43, 79, 255";

    // Generate gentle presence nodes
    const nodeCount = Math.max(12, Math.min(24, Math.floor(width / 70)));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: Math.random() * 1.5 + 1,
      baseAlpha: Math.random() * 0.05 + 0.03, // Low opacity: 3% - 8%
      pulseSpeed: Math.random() * 0.015 + 0.005,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      tick += 1;

      // Draw faint connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const lineAlpha = (1 - dist / 140) * 0.035;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${accentColor}, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0) node.x = width;
          if (node.x > width) node.x = 0;
          if (node.y < 0) node.y = height;
          if (node.y > height) node.y = 0;
        }

        const alpha =
          node.baseAlpha +
          Math.sin(tick * node.pulseSpeed + node.pulsePhase) * 0.02;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentColor}, ${Math.max(0.01, alpha)})`;
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [dark]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-700"
      style={{ opacity: 1 }}
    >
      {/* Soft central presence pulse halo */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full transition-opacity duration-700"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(123, 158, 255, 0.035) 0%, rgba(123, 158, 255, 0.008) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(43, 79, 255, 0.025) 0%, rgba(43, 79, 255, 0.005) 45%, transparent 70%)",
        }}
      />

      {/* Gentle concentric radar pulse for main presence view */}
      {variant === "presence" && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full animate-ping opacity-[0.02]"
          style={{
            border: `1px solid ${theme.accent}`,
            animationDuration: "8s",
          }}
        />
      )}

      {/* Canvas for drifting presence nodes */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
