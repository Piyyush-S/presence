// src/components/AppShell.jsx
import React, { useEffect, useState } from "react";
import {
  Radio,
  Users,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";
import BottomNav from "./BottomNav";
import AmbientBackground from "./AmbientBackground";
import { getVibeInfo } from "../constants/vibes";

export default function AppShell({
  active = "home", // "home" | "friends" | "chats" | "notifications" | "profile"
  onNavigate,
  onLogout,
  notificationCount = 0,
  children,
  ambientVariant = "default",
}) {
  const { dark, toggleDark, theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const navItems = [
    { id: "home", label: "Presence", icon: Radio },
    { id: "friends", label: "Friends", icon: Users },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "notifications", label: "Alerts", icon: Bell, count: notificationCount },
  ];

  const currentVibe = getVibeInfo(currentUser?.mood || "Calm ☁️");

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 relative w-full overflow-x-hidden"
      style={{ background: theme.bg, color: theme.fg }}
    >
      {/* Background Atmosphere */}
      <AmbientBackground variant={ambientVariant} />

      {/* ================= DESKTOP & TABLET SIDEBAR ================= */}
      <aside
        className="hidden md:flex flex-col justify-between flex-shrink-0 z-30 sticky top-0 h-screen transition-colors duration-300 w-56 lg:w-64"
        style={{
          background: dark ? "rgba(5, 5, 5, 0.85)" : "rgba(250, 250, 250, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: `1px solid ${theme.border}`,
        }}
      >
        {/* Top: Brand Header */}
        <div className="p-6 pb-4">
          <div
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span
              className="text-2xl font-normal tracking-tight transition-transform duration-200 group-hover:scale-[1.02]"
              style={{
                fontFamily: "'Playfair Display', serif",
                letterSpacing: "-0.02em",
                color: theme.fg,
              }}
            >
              pause
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: theme.accentMuted,
                border: `1px solid ${theme.accentBorder}`,
                color: theme.accent,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
          </div>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer group"
                style={{
                  background: isActive ? theme.card : "transparent",
                  border: `1px solid ${isActive ? theme.border : "transparent"}`,
                  color: isActive ? theme.fg : theme.muted,
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    style={{
                      color: isActive ? theme.accent : theme.muted,
                    }}
                    className="transition-colors duration-200 group-hover:text-[#7B9EFF]"
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {Boolean(item.count && item.count > 0) && (
                  <span
                    className="px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold rounded-full flex items-center justify-center text-white"
                    style={{ background: theme.accent }}
                  >
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div
            className="my-3 border-t"
            style={{ borderColor: theme.border }}
          />

          {/* Profile & Secondary Links */}
          <button
            onClick={() => onNavigate?.("profile")}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: active === "profile" ? theme.card : "transparent",
              border: `1px solid ${active === "profile" ? theme.border : "transparent"}`,
              color: active === "profile" ? theme.fg : theme.muted,
            }}
          >
            <User
              size={17}
              strokeWidth={active === "profile" ? 2.2 : 1.7}
              style={{
                color: active === "profile" ? theme.accent : theme.muted,
              }}
            />
            <span className="tracking-tight">Profile</span>
          </button>

          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: "transparent",
              color: theme.muted,
            }}
          >
            <div className="flex items-center gap-3">
              {dark ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
              <span className="tracking-tight">{dark ? "Light mode" : "Dark mode"}</span>
            </div>
            <span className="text-[10px] opacity-60 uppercase tracking-widest">{dark ? "OFF" : "ON"}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: "transparent",
                color: theme.muted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.danger;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.muted;
              }}
            >
              <LogOut size={16} strokeWidth={1.7} />
              <span className="tracking-tight">Leave space</span>
            </button>
          )}
        </div>

        {/* Bottom: "Your Presence" Mini-Card */}
        <div className="p-3.5 m-3 rounded-2xl border transition-all duration-300"
          style={{
            background: theme.card,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar
              src={currentUser?.img}
              name={currentUser?.name}
              email={currentUser?.email}
              size={36}
              status="online"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold truncate" style={{ color: theme.fg }}>
                {currentUser?.name || currentUser?.username || "You"}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium" style={{ color: theme.muted }}>
                  Present now
                </span>
              </div>
            </div>
          </div>

          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px]"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
            }}
          >
            <span className="truncate font-medium" style={{ color: theme.accent }}>
              {currentVibe.name}
            </span>
            <span className="text-[10px] text-muted opacity-70">Active</span>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Scrollable Container with adequate padding on mobile so BottomNav never overlaps */}
        <div className="flex-1 w-full pb-28 md:pb-8">
          {children}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <BottomNav
            active={active}
            notificationCount={notificationCount}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
