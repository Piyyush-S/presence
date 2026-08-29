import React from "react";
import { useTheme } from "../context/ThemeContext";

function Block({ title, text, list }) {
  const { theme } = useTheme();
  return (
    <div className="space-y-2">
      <h3
        className="font-medium text-base tracking-tight"
        style={{ color: theme.fg, fontFamily: "'Manrope', sans-serif" }}
      >
        {title}
      </h3>
      {text && (
        <p className="leading-relaxed text-sm" style={{ color: theme.muted }}>
          {text}
        </p>
      )}
      {list && (
        <ul
          className="list-disc list-inside space-y-1.5 pl-1 text-sm leading-relaxed"
          style={{ color: theme.muted }}
        >
          {list.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PrivacyPolicy({ onBack }) {
  const { dark, toggleDark, theme } = useTheme();

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{ background: theme.bg, color: theme.fg }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 transition-colors duration-300"
        style={{
          background: theme.bg,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              color: theme.fg,
              textDecoration: "none",
            }}
          >
            pause
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
              }}
            >
              {dark ? "light" : "dark"}
            </button>
            <button
              onClick={onBack}
              className="text-xs font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                background: theme.fg,
                color: theme.bg,
                border: "none",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-10">
          <h1
            className="text-3xl sm:text-4xl font-normal tracking-tight mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-xs" style={{ color: theme.muted }}>
            Last updated: 2026
          </p>
        </div>

        <div
          className="p-8 sm:p-10 space-y-8 rounded-2xl"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
          }}
        >
          <Block
            title="1. Philosophy"
            text="Pause is built around intentional, respectful, real-time presence. We collect only what is strictly necessary to make the experience work."
          />

          <Block
            title="2. Information We Collect"
            list={[
              "Account credentials (email) for secure authentication",
              "Profile details you choose to provide (name, age, city, gender, mood, bio)",
              "Real-time presence signals (online status, mood) when you choose to appear",
              "Direct messages and call signaling data to enable communication",
            ]}
          />

          <Block
            title="3. How Your Data Is Used"
            list={[
              "To display accurate presence when you are actively present",
              "To connect you with friends and facilitate private conversations",
              "To maintain account security and prevent abuse",
            ]}
          />

          <Block
            title="4. Presence & Boundaries"
            text="Your presence status is active only when you are in the app. There are no background trackers, streaks, read receipts, or persistent activity monitoring."
          />

          <Block
            title="5. Data Retention & Control"
            text="You have complete control over your data. You can edit your profile details, clear conversations, and delete your account anytime."
          />
        </div>
      </main>
    </div>
  );
}
