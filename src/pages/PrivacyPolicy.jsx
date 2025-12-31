import React from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function PrivacyPolicy({ onBack }) {
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
        {/* ===== PRIVACY CONTENT ===== */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-2 text-indigo-600">
            Privacy Policy
          </h2>

          <p className="text-sm opacity-60 mb-10">
            Last updated: 31/12/2025
          </p>

          <div className="space-y-10 text-sm leading-relaxed">
            <Block
              title="1. Our Philosophy"
              text="Presence Grid is built around intentional, respectful, real-time connection. We collect only what is necessary to make that experience work."
            />

            <Block
              title="2. Information We Collect"
              list={[
                "Email address for authentication",
                "Basic profile details (name, age, city, gender)",
                "Presence signals (online status, mood, availability)",
                "Messages exchanged inside the platform",
              ]}
            />

            <Block
              title="3. How Your Data Is Used"
              list={[
                "To show accurate presence and availability",
                "To enable conversations",
                "To maintain platform safety",
                "To improve reliability and performance",
              ]}
            />

            <Block
              title="4. What We Do NOT Do"
              list={[
                "We do not sell your data",
                "We do not run ads",
                "We do not track you outside Presence Grid",
                "We do not build behavioral profiles",
              ]}
            />

            <Block
              title="5. Messages & Conversations"
              text="Messages are stored only to enable conversations and platform functionality. Presence Grid does not read private conversations unless required after a report for moderation."
            />

            <Block
              title="6. Security"
              text="We use industry-standard security practices and trusted infrastructure providers. While no system is perfect, protecting your data is a core priority."
            />

            <Block
              title="7. Your Control"
              text="You can edit your profile, log out, or stop using the service at any time. Account deletion options may be added in the future."
            />

            <Block
              title="8. Changes to This Policy"
              text="If this policy changes, users will be notified clearly within the app."
            />

            <Block
              title="9. Contact"
              text="For privacy-related questions or concerns, contact us at support@presencegrid.com"
            />
          </div>
        </section>

        {/* ===== SIDE SPACE (INTENTIONAL) ===== */}
        <aside className="hidden lg:flex flex-col gap-8 pt-8">
          {/* Plain English Summary */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6 shadow-lg">
            <h3 className="font-semibold mb-4 text-indigo-600">
              In Simple Words
            </h3>
            <ul className="text-sm space-y-2 opacity-80">
              <li>• We collect very little</li>
              <li>• We don’t sell your data</li>
              <li>• You control your presence</li>
              <li>• Privacy comes before growth</li>
            </ul>
          </div>

          {/* Values Strip */}
          <div className="flex flex-col items-start gap-4 pl-2">
            <Value text="Privacy" />
            <Value text="Respect" />
            <Value text="Transparency" />
          </div>

          {/* Founder Note */}
          <div className="text-xs italic opacity-60 max-w-xs">
            Presence Grid is designed to feel safe, calm,
            and human — not extractive.
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
