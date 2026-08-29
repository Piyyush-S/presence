// src/components/UserCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, UserPlus, MapPin, Clock, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";
import { getVibeInfo } from "../constants/vibes";

export default function UserCard({
  user,
  isFriend = false,
  isRequested = false,
  isIncoming = false,
  onView,
  onRequest,
  onAccept,
  onChat,
  onUnfriend,
  onBlock,
  className = "",
}) {
  const { theme } = useTheme();

  const isOnline = Boolean(user?.active);
  const vibeInfo = getVibeInfo(user?.mood || user?.vibe || "Calm ☁️");

  // Calculate gentle presence duration or last active
  const formatPresenceTime = () => {
    if (isOnline) return "Present now";
    if (user?.lastActive?.seconds) {
      const diffMin = Math.max(1, Math.round((Date.now() / 1000 - user.lastActive.seconds) / 60));
      if (diffMin < 60) return `Active ${diffMin}m ago`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      return "Quiet";
    }
    return "Quiet";
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
      }}
      whileHover={{ y: -2, scale: 1.008 }}
      transition={{ duration: 0.2 }}
      className={`p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${className}`}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Top section: Avatar + Info */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar
              src={user?.img}
              name={user?.name}
              email={user?.email}
              size={48}
              aura={user?.aura}
              status={isOnline ? "online" : "offline"}
            />
            <div className="min-w-0 flex-1">
              <h4
                className="text-sm font-semibold truncate transition-colors duration-200"
                style={{ color: theme.fg, fontFamily: "'Manrope', sans-serif" }}
              >
                {user?.name || user?.username || user?.email?.split("@")[0] || "Friend"}
              </h4>
              {user?.username && (
                <p className="text-[11px] truncate mt-0.5" style={{ color: theme.muted }}>
                  @{user.username}
                </p>
              )}
            </div>
          </div>

          {/* Online/Duration badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0"
            style={{
              background: isOnline ? theme.accentMuted : theme.surface,
              border: `1px solid ${isOnline ? theme.accentBorder : theme.border}`,
              color: isOnline ? theme.accent : theme.muted,
            }}
          >
            {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            <span>{formatPresenceTime()}</span>
          </div>
        </div>

        {/* Vibe badge with short description */}
        <div
          className="my-3 px-3 py-2 rounded-xl flex items-center justify-between gap-2"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">{vibeInfo.emoji}</span>
            <div className="min-w-0">
              <span className="text-xs font-semibold block truncate" style={{ color: theme.fg }}>
                {vibeInfo.label}
              </span>
              <span className="text-[10px] block truncate" style={{ color: theme.muted }}>
                {vibeInfo.description}
              </span>
            </div>
          </div>
        </div>

        {/* Bio / Status */}
        {user?.bio && (
          <p
            className="text-xs leading-relaxed line-clamp-2 my-2"
            style={{ color: theme.muted }}
          >
            {user.bio}
          </p>
        )}

        {/* City tag */}
        {user?.city && (
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider mt-2 mb-1" style={{ color: theme.mutedMore }}>
            <MapPin size={11} />
            <span className="truncate">{user.city}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        className="pt-3 mt-3 border-t flex items-center justify-between gap-2"
        style={{ borderColor: theme.border }}
      >
        {onView && (
          <button
            onClick={() => onView(user)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: "transparent",
              color: theme.muted,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
          >
            View
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isFriend ? (
            <>
              {onUnfriend && (
                <button
                  onClick={() => onUnfriend(user.email)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.muted,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
                  title="Disconnect friend"
                >
                  Unfriend
                </button>
              )}
              <button
                onClick={() => onChat?.(user.email)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 text-white transition-all cursor-pointer shadow-sm"
                style={{ background: theme.accent }}
              >
                <MessageSquare size={13} />
                <span>Chat</span>
              </button>
            </>
          ) : isRequested ? (
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
              }}
            >
              <Clock size={12} />
              <span>Pending</span>
            </span>
          ) : isIncoming ? (
            <button
              onClick={() => onAccept?.(user.email)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 text-white transition-all cursor-pointer"
              style={{ background: theme.accent }}
            >
              <Check size={13} />
              <span>Accept</span>
            </button>
          ) : (
            <button
              onClick={() => onRequest?.(user.email)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: theme.accentMuted,
                border: `1px solid ${theme.accentBorder}`,
                color: theme.accent,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.accent;
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.accentMuted;
                e.currentTarget.style.color = theme.accent;
              }}
            >
              <UserPlus size={13} />
              <span>Share Presence</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
