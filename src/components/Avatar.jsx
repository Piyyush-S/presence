import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

function getInitials(name, email) {
  if (name && typeof name === "string" && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && typeof email === "string" && email.trim()) {
    const handle = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    return handle.slice(0, 2).toUpperCase() || "P";
  }
  return "P";
}

function isDisallowedUrl(url) {
  if (!url || typeof url !== "string") return true;
  const disallowed = ["pravatar.cc", "randomuser.me", "unsplash.com", "placeholder"];
  return disallowed.some((d) => url.toLowerCase().includes(d));
}

export default function Avatar({
  src,
  name = "",
  email = "",
  size = 40,
  status = null, // e.g. { label, colorClass } or "online" | "recent" | "offline"
  aura = null,
  className = "",
  style = {},
  onClick,
}) {
  const { dark, theme } = useTheme();
  const [imgError, setImgError] = useState(false);

  const hasValidPhoto = Boolean(src && !isDisallowedUrl(src) && !imgError);
  const initials = getInitials(name, email);

  // Derive status color
  let statusColor = null;
  let statusLabel = "";
  if (status) {
    if (typeof status === "object") {
      statusLabel = status.label || "";
      if (status.colorClass?.includes("green")) statusColor = "#51cf66";
      else if (status.colorClass?.includes("yellow")) statusColor = "#fcc419";
      else statusColor = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    } else if (typeof status === "string") {
      statusLabel = status;
      if (status === "online" || status === "active") statusColor = "#51cf66";
      else if (status === "recent" || status === "away") statusColor = "#fcc419";
      else statusColor = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    }
  }

  const dotSize = Math.max(8, Math.round(size * 0.24));
  const fontSize = Math.max(11, Math.round(size * 0.38));

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {/* Outer aura ring if specified */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
        style={{
          boxShadow: aura ? `0 0 ${Math.round(size * 0.25)}px ${aura}55` : "none",
          border: aura
            ? `1.5px solid ${aura}`
            : `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        {hasValidPhoto ? (
          <img
            src={src}
            alt={name || email || "Avatar"}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center font-medium tracking-tight transition-colors duration-200"
            style={{
              background: dark ? "rgba(123, 158, 255, 0.14)" : "rgba(43, 79, 255, 0.09)",
              color: theme.accent,
              fontSize,
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Presence Status Dot */}
      {statusColor && (
        <span
          title={statusLabel}
          className="absolute rounded-full transition-all"
          style={{
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            background: statusColor,
            border: `2px solid ${theme.bg}`,
            boxShadow: `0 0 4px ${statusColor}66`,
          }}
        />
      )}
    </div>
  );
}
