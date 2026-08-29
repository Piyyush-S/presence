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

export default function TermsOfService({ onBack }) {
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
            Terms of Service
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
            title="1. Purpose of Pause"
            text="Pause is a real-time social platform designed for intentional, calm, and respectful conversations. It is not an advertising network, engagement trap, or anonymous harassment service."
          />

          <Block
            title="2. Community Standards"
            list={[
              "Respect others' boundaries, time, and attention",
              "Do not spam, impersonate, harass, or abuse other members",
              "Use presence indicators honestly and without manipulation",
              "Do not distribute malicious content, scripts, or offensive media",
            ]}
          />

          <Block
            title="3. Account Responsibility"
            text="You are responsible for keeping your login credentials confidential and for all actions conducted through your account."
          />

          <Block
            title="4. Modifications"
            text="We may update these terms as Pause evolves. Any changes will be posted here with reasonable advance notice."
          />
        </div>
      </main>
    </div>
  );
}
