import React, { useEffect, useRef, useState } from "react";
import useDarkMode from "../hooks/useDarkMode";

/* =====================================================
   SCROLL REVEAL
===================================================== */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Reveal({ children, id }) {
  const ref = useReveal();
  return (
    <div ref={ref} id={id} className="reveal">
      {children}
    </div>
  );
}

function Section({ id, children }) {
  return (
    <section id={id} className="py-28 md:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {children}
      </div>
    </section>
  );
}

/* =====================================================
   PRESENCE (UI ONLY)
===================================================== */
function useAmbientPresence() {
  const [text, setText] = useState(null);

  useEffect(() => {
    const states = [
      "Someone is available right now",
      "A few people are present",
      "Presence is quiet",
      "No one is available — and that’s okay",
      null,
    ];

    const tick = () => {
      setText(states[Math.floor(Math.random() * states.length)]);
    };

    tick();
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  return text;
}

/* =====================================================
   NAVBAR
===================================================== */
function Navbar({ dark, toggleDark, onLogin, onSignup }) {
  return (
    <nav className="
      sticky top-0 z-50
      backdrop-blur-xl
      bg-white/80 dark:bg-[#05070f]/80
      border-b border-black/10 dark:border-white/10
    ">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">

        <h1 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
          Presence Grid
        </h1>

        <div className="hidden md:flex gap-12 text-lg font-medium">
          <a href="#about" className="opacity-80 hover:opacity-100">About</a>
          <a href="#features" className="opacity-80 hover:opacity-100">Features</a>
          <a href="#faq" className="opacity-80 hover:opacity-100">Q&amp;A</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDark}
            className="px-3 py-2 text-sm rounded-lg border border-black/20 dark:border-white/20"
          >
            {dark ? "Light" : "Dark"}
          </button>

          <button
            onClick={onLogin}
            className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-black/20 dark:border-white/20 text-sm"
          >
            Login
          </button>

          <button
            onClick={onSignup}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* =====================================================
   MAIN COMPONENT (PARTIAL)
===================================================== */
export default function LandingPage({
  onLogin,
  onSignup,
  onOpenTerms,
  onOpenPrivacy,
}) {
  const [dark, toggleDark] = useDarkMode();
  const presence = useAmbientPresence();

  return (
    <div className={`
      min-h-screen transition-colors duration-700
      ${dark
        ? "bg-gradient-to-br from-[#05070f] via-[#0b1020] to-[#05070f] text-slate-100"
        : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-900"
      }
    `}>
      <Navbar
        dark={dark}
        toggleDark={toggleDark}
        onLogin={onLogin}
        onSignup={onSignup}
      />

      {/* ================= HERO ================= */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-6 md:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/80 to-transparent dark:from-[#05070f]/80" />

        <div className="absolute w-[420px] h-[420px] bg-indigo-600/20 blur-[140px] rounded-full -top-32 -left-32" />
        <div className="absolute w-[360px] h-[360px] bg-purple-500/20 blur-[140px] rounded-full bottom-0 right-0" />

        <div className="relative max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
            Be present.
            <br />
            <span className="text-indigo-500">Not loud.</span>
          </h2>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-2xl opacity-80">
            A real-time social space where conversations happen only when people are actually available.
          </p>

          {presence && (
            <div className="mt-10 flex justify-center">
              <div className="px-5 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <span className="text-sm opacity-80">{presence}</span>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onSignup}
              className="px-10 py-4 rounded-xl bg-indigo-600 text-white font-semibold"
            >
              Start calmly
            </button>

            <button
              onClick={onLogin}
              className="px-10 py-4 rounded-xl border font-semibold"
            >
              Log in
            </button>
          </div>
        </div>
      </section>
      {/* ================= ABOUT ================= */}
      <Section id="about">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-10">
            Why Presence Grid exists
          </h3>

          <p className="text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
            Most social platforms reward speed, noise, and constant visibility.
            Presence Grid is built for the opposite.
          </p>

          <p className="mt-6 text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
            You show up only when you are available.
            Conversations happen with intention.
            Silence is never punished.
          </p>
        </div>
      </Section>

      {/* ================= FEATURES ================= */}
      <Section id="features">
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-20 text-center">
          Features
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
        {[
  {
    title: "Availability toggle",
    desc: "Go present only when you want to talk. Stay invisible otherwise.",
  },
  {
    title: "Timed conversations",
    desc: "Every conversation ends naturally. No dragging, no pressure.",
  },
  {
    title: "No unread pressure",
    desc: "No message counts, no inbox anxiety, nothing piling up.",
  },
  {
    title: "Zero public metrics",
    desc: "No likes, followers, streaks, or visible numbers.",
  },
  {
    title: "Session-based chats",
    desc: "Each interaction exists only in the moment.",
  },
  {
    title: "Quiet presence",
    desc: "See who is available without interrupting them.",
  },
].map((f, i) => (
  <div
    key={i}
    className="
      rounded-2xl p-10
      bg-slate-800/90
      border border-white/10
      shadow-md
      transition
      hover:-translate-y-1
      hover:shadow-xl
    "
  >
    <h4 className="text-xl md:text-2xl font-semibold mb-4 text-white">
      {f.title}
    </h4>

    <p className="text-base md:text-lg leading-relaxed text-white/80">
      {f.desc}
    </p>
  </div>
))}




        </div>
      </Section>

      {/* ================= TIMELINE ================= */}
      <Reveal>
        <Section>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
            Presence over a typical day
          </h3>

          <div className="max-w-3xl mx-auto space-y-12 text-base sm:text-lg">
            <TimelineRow
              time="Morning"
              text="Mostly quiet. A few people check in."
            />
            <TimelineRow
              time="Afternoon"
              text="Some availability. Short conversations happen."
            />
            <TimelineRow
              time="Evening"
              text="Most conversations happen during this time."
            />
            <TimelineRow
              time="Night"
              text="Silence returns. Nothing breaks."
            />
          </div>
        </Section>
      </Reveal>
      {/* ================= QUIET TRANSITION ================= */}
      <section className="py-24 md:py-32 text-center text-base md:text-lg opacity-60">
        Most of the time, nothing happens here.
        <br />
        That’s intentional.
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <Reveal>
        <Section>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
            A different way to be social
          </h3>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20 text-base sm:text-lg leading-relaxed">
            <div className="space-y-6 opacity-80">
              <p>
                Most social platforms are built around attention.
                They reward speed, volume, and constant visibility.
              </p>

              <p>
                Presence Grid is built around availability.
                You appear only when you choose to.
              </p>
            </div>

            <div className="space-y-6 opacity-80">
              <p>
                Silence is not punished here.
                Missed messages do not pile up.
              </p>

              <p>
                Conversations end on purpose,
                so they don’t turn into obligations.
              </p>
            </div>
          </div>
        </Section>
      </Reveal>

      {/* ================= SCENARIOS ================= */}
      <Reveal>
        <Section>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
            What happens when…
          </h3>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto text-base sm:text-lg">
            {[
              {
                q: "No one is available?",
                a: "Nothing. You leave. There’s no penalty for absence.",
              },
              {
                q: "The timer ends?",
                a: "The conversation ends. No pressure to continue.",
              },
              {
                q: "Someone doesn’t reply?",
                a: "Nothing bad happens. Silence is allowed.",
              },
              {
                q: "You leave mid-conversation?",
                a: "The session ends quietly. No explanations required.",
              },
            ].map((s, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-3">{s.q}</h4>
                <p className="opacity-80 leading-relaxed">{s.a}</p>
              </div>
            ))}
          </div>
        </Section>
      </Reveal>

      {/* ================= COMPARISON ================= */}
      <Reveal>
        <Section>
          <div className="grid md:grid-cols-2 gap-16 md:gap-28">
            <div>
              <h4 className="text-2xl sm:text-3xl font-semibold mb-8 text-center md:text-left">
                Most social apps
              </h4>

              <ul className="space-y-4 text-base sm:text-lg opacity-80">
                <li>Encourage constant activity</li>
                <li>Punish silence</li>
                <li>Never let conversations end</li>
                <li>Measure worth with numbers</li>
                <li>Create anxiety around replies</li>
              </ul>
            </div>

            <div>
              <h4 className="text-2xl sm:text-3xl font-semibold mb-8 text-indigo-500 text-center md:text-left">
                Presence Grid
              </h4>

              <ul className="space-y-4 text-base sm:text-lg opacity-80">
                <li>Rewards availability</li>
                <li>Protects silence</li>
                <li>Ends conversations intentionally</li>
                <li>No public metrics</li>
                <li>Does not demand attention</li>
              </ul>
            </div>
          </div>
        </Section>
      </Reveal>

      {/* ================= FOUNDER ================= */}
      <Reveal>
        <Section id="founder">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="space-y-6 text-base sm:text-lg opacity-80 leading-relaxed">
              <p>
                Hi, I’m <span className="font-medium">Piyush Sharma</span>.
              </p>

              <p>
                I started building Presence Grid because most social
                apps feel rushed and noisy, with constant pressure to stay visible.
              </p>

              <p>
                I wanted something quieter — where being unavailable
                is normal, and conversations don’t feel like tasks.
              </p>

              <p>
                Presence Grid is my attempt at that.
                It’s slow on purpose.
              </p>

              <a
                href="https://instagram.com/piyyush.z"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-6 text-indigo-500 font-medium hover:underline"
              >
                Follow the build on Instagram →
              </a>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-[120px]" />
                <img
                  src="/founder.jpg"
                  alt="Piyush Sharma"
                  className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full object-cover border border-black/10 dark:border-white/10 shadow-2xl"
                />
              </div>
            </div>
          </div>
        </Section>
      </Reveal>

      {/* ================= VALUES ================= */}
      <Reveal>
        <Section>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
            What Presence Grid believes
          </h3>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12 text-base sm:text-lg">
            {[
              ["Silence is valid", "Not replying immediately is a boundary, not a failure."],
              ["Attention isn’t currency", "No likes, streaks, or performance metrics."],
              ["Availability is intentional", "You choose when you’re present."],
              ["Conversations can end", "Nothing is designed to trap you."],
              ["Small is okay", "Quality moments matter more than scale."],
              ["Calm beats clever", "No tricks or dark patterns."],
            ].map(([title, text], i) => (
              <div key={i}>
                <h4 className="font-semibold mb-3">{title}</h4>
                <p className="opacity-80">{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </Reveal>
      {/* ================= FAQ ================= */}
      <Reveal>
        <Section id="faq">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
            Frequently asked questions
          </h3>

          <div className="max-w-3xl mx-auto divide-y divide-black/10 dark:divide-white/10">
            <details className="group py-6">
              <summary className="flex justify-between items-center cursor-pointer list-none text-base sm:text-lg font-medium">
                Is this a dating app?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 opacity-80 leading-relaxed">
                No. Presence Grid is about conversations, not matching,
                swiping, or competing profiles.
              </p>
            </details>

            <details className="group py-6">
              <summary className="flex justify-between items-center cursor-pointer list-none text-base sm:text-lg font-medium">
                Why are conversations time-limited?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 opacity-80 leading-relaxed">
                Natural endings reduce pressure. Conversations feel lighter
                when they are allowed to end.
              </p>
            </details>

            <details className="group py-6">
              <summary className="flex justify-between items-center cursor-pointer list-none text-base sm:text-lg font-medium">
                What if I don’t reply?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 opacity-80 leading-relaxed">
                Nothing happens. There are no penalties, streaks, or reminders.
              </p>
            </details>

            <details className="group py-6">
              <summary className="flex justify-between items-center cursor-pointer list-none text-base sm:text-lg font-medium">
                Is my availability public?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 opacity-80 leading-relaxed">
                Only when you choose to be present. Otherwise, you are invisible.
              </p>
            </details>

            <details className="group py-6">
              <summary className="flex justify-between items-center cursor-pointer list-none text-base sm:text-lg font-medium">
                Is this meant to replace other social apps?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 opacity-80 leading-relaxed">
                No. Presence Grid is designed to sit quietly alongside your life.
              </p>
            </details>
          </div>
        </Section>
      </Reveal>

      {/* ================= FINAL CTA ================= */}
      <Reveal>
        <Section>
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-8">
              You don’t need to be always online
            </h3>

            <p className="text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
              Presence Grid doesn’t reward noise.
              It waits for you.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onSignup}
                className="px-10 py-4 rounded-xl bg-indigo-600 text-white font-semibold text-base sm:text-lg"
              >
                Enter calmly
              </button>

              <button
                onClick={onLogin}
                className="px-10 py-4 rounded-xl border font-semibold text-base sm:text-lg"
              >
                Log in
              </button>
            </div>
          </div>
        </Section>
      </Reveal>

      {/* ================= FOOTER ================= */}
      <footer className="py-16 border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm opacity-70">
          <p>© {new Date().getFullYear()} Presence Grid</p>

          <div className="flex gap-6">
            <button onClick={onOpenTerms} className="hover:underline">
              Terms
            </button>
            <button onClick={onOpenPrivacy} className="hover:underline">
              Privacy
            </button>
          </div>
        </div>
      </footer>

      {/* ================= REVEAL STYLES ================= */}
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

/* =====================================================
   TIMELINE ROW (DEFINED LAST, SAFE)
===================================================== */
function TimelineRow({ time, text }) {
  return (
    <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] gap-6 sm:gap-10">
      <div className="font-medium">{time}</div>
      <div className="opacity-80">{text}</div>
    </div>
  );
}
