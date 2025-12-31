import React from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function TermsOfService({ onBack }) {
  const [dark] = useDarkMode();

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        dark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100"
          : "bg-gradient-to-br from-white via-indigo-50 to-purple-50 text-slate-900"
      }`}
    >
      {/* ================= HEADER ================= */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">
          Presence Grid
        </h1>

        <button
          onClick={onBack}
          className="text-sm px-4 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5"
        >
          ← Back
        </button>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-6xl mx-auto px-6 pb-24 grid lg:grid-cols-[1fr_320px] gap-12">
        {/* ===== TERMS CONTENT ===== */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-2 text-indigo-600">
            Terms of Service
          </h2>

          <p className="text-sm opacity-60 mb-10">
            Last updated: 31/12/2025
          </p>

          <div className="space-y-10 text-sm leading-relaxed">
            <Block
              title="1. Purpose of Presence Grid"
              text="Presence Grid is a real-time social platform designed for intentional, respectful conversations. It is not a dating app, advertising network, or anonymous chat service."
            />

            <Block
              title="2. User Responsibilities"
              list={[
                "Respect other users",
                "Provide accurate information",
                "Do not harass, impersonate, or spam",
                "Use presence indicators honestly",
              ]}
            />

            <Block
              title="3. Content & Conduct"
              text="You are responsible for what you share. Presence Grid does not guarantee the behavior of other users and is not responsible for user-generated content."
            />

            <Block
              title="4. Platform Availability"
              text="Presence Grid is provided “as is”. Features may change, pause, or be removed as the platform evolves."
            />

            <Block
              title="5. Account Suspension"
              text="We reserve the right to suspend or restrict accounts that violate these terms or harm the community."
            />

            <Block
              title="6. Privacy"
              text="We respect your privacy. Please review our Privacy Policy to understand how your data is handled."
            />

            <Block
              title="7. Changes to Terms"
              text="These terms may be updated as Presence Grid evolves. Continued use of the platform implies acceptance of the latest version."
            />
          </div>
        </section>

        {/* ===== SIDE SPACE (INTENTIONAL) ===== */}
        <aside className="hidden lg:flex flex-col gap-8 pt-8">
          {/* Plain English Summary */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6 shadow-lg">
            <h3 className="font-semibold mb-4 text-indigo-600">
              Plain English Summary
            </h3>
            <ul className="text-sm space-y-2 opacity-80">
              <li>• Be respectful</li>
              <li>• No harassment or spam</li>
              <li>• We don’t sell your data</li>
              <li>• The platform will evolve</li>
            </ul>
          </div>

          {/* Values Strip */}
          <div className="flex flex-col items-start gap-4 pl-2">
            <Value text="Calm" />
            <Value text="Respect" />
            <Value text="Presence" />
          </div>

          {/* Founder Note */}
          <div className="text-xs italic opacity-60 max-w-xs">
            Presence Grid is built by humans who believe conversation
            should feel calm, intentional, and real.
            <br />— Piyu
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function Block({ title, text, list }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>

      {text && <p className="opacity-80">{text}</p>}

      {list && (
        <ul className="list-disc ml-5 space-y-1 opacity-80">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Value({ text }) {
  return (
    <div className="text-lg font-semibold tracking-wide text-indigo-500">
      {text}
    </div>
  );
}
