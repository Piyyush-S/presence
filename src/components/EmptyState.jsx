// src/components/EmptyState.jsx
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = "",
}) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`py-14 sm:py-18 px-6 text-center rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Soft halo glow behind icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative transition-all"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full animate-pulse opacity-40"
          style={{
            background: theme.accentMuted,
            filter: "blur(8px)",
          }}
        />
        {Icon && (
          <div className="animate-float relative z-10" style={{ color: theme.accent }}>
            <Icon size={24} strokeWidth={1.75} />
          </div>
        )}
      </div>

      <h3
        className="text-base font-normal tracking-tight mb-1.5"
        style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-xs leading-relaxed max-w-sm mb-5"
          style={{ color: theme.muted }}
        >
          {description}
        </p>
      )}

      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
          style={{
            background: theme.fg,
            color: theme.bg,
            border: "none",
            borderRadius: 8,
          }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
}
