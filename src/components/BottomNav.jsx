import React from "react";
import { motion } from "framer-motion";
import { Radio, Users, MessageSquare, Bell, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function BottomNav({ active = "home", onNavigate, notificationCount = 0 }) {
  const { dark, theme } = useTheme();

  const navItems = [
    { id: "home", label: "Presence", icon: Radio },
    { id: "friends", label: "Friends", icon: Users },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "notifications", label: "Alerts", icon: Bell, count: notificationCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="w-full max-w-md mx-auto flex items-center justify-between px-3 py-2 transition-all duration-300"
      style={{
        background: dark ? "rgba(10, 10, 10, 0.88)" : "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${theme.border}`,
        borderRadius: 20,
        boxShadow: dark
          ? "0 8px 32px rgba(0, 0, 0, 0.6)"
          : "0 8px 30px rgba(0, 0, 0, 0.08)",
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        return (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.(item.id)}
            className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors duration-200 cursor-pointer"
            style={{
              color: isActive ? theme.accent : theme.muted,
              fontFamily: "'Manrope', sans-serif",
            }}
            title={item.label}
          >
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.3 : 1.8}
                className="transition-all duration-200"
              />
              {Boolean(item.count && item.count > 0) && (
                <span
                  className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center text-white"
                  style={{ background: theme.accent }}
                >
                  {item.count > 9 ? "9+" : item.count}
                </span>
              )}
            </div>

            <span
              className="text-[10px] mt-1 tracking-tight font-medium transition-all duration-200"
              style={{
                color: isActive ? theme.fg : theme.muted,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </span>

            {isActive && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                style={{ background: theme.accent }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
