import React, { useEffect, useRef } from "react";
import useDarkMode from "../hooks/useDarkMode";

/* ---------------- SCROLL REVEAL HOOK ---------------- */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && el.classList.add("reveal-visible"),
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function LandingPage({
  onLogin,
  onSignup,
  onOpenTerms,
  onOpenPrivacy,
}) {
  const [dark, toggleDark] = useDarkMode();

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        dark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-900"
      }`}
    >
      {/* ================= NAV ================= */}
      <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-slate-900/70 border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">
            Presence Grid
          </h1>

          <div className="hidden md:flex gap-8 text-sm font-medium">
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("how")}>How it works</button>
            <button onClick={() => scrollTo("about")}>About</button>
            <button onClick={() => scrollTo("faq")}>FAQ</button>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={toggleDark}
              className="px-3 py-1.5 rounded-lg border text-xs"
            >
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>

            <button onClick={onLogin} className="px-4 py-2 rounded-lg border">
              Login
            </button>

            <button
              onClick={onSignup}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="text-center px-6 pt-32 pb-40">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6">
          Be present.{" "}
          <span className="text-indigo-600">Not loud.</span>
        </h2>

        <p className="max-w-2xl mx-auto text-xl opacity-80">
          A real-time social space where conversations happen
          because people are actually available.
        </p>

        <div className="mt-12 flex justify-center gap-6">
          <button
            onClick={onSignup}
            className="px-10 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:scale-105 transition"
          >
            Get Started
          </button>

          <button
            onClick={onLogin}
            className="px-10 py-4 rounded-xl border font-semibold hover:scale-105 transition"
          >
            Log In
          </button>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <Reveal id="features">
        <section className="max-w-6xl mx-auto px-8 py-32">
          <h3 className="text-4xl font-bold text-center mb-20">
            Features
          </h3>

          <div className="grid md:grid-cols-3 gap-10">
            <Feature icon="🟢" title="Live Presence" text="See who is actually online right now." />
            <Feature icon="💬" title="Intentional Chats" text="No noise. No spam. Just talk." />
            <Feature icon="⏱️" title="8-Minute Sessions" text="Conversations end naturally." />
            <Feature icon="🎭" title="Mood Based Discovery" text="Find people by mindset." />
            <Feature icon="🕒" title="Set Availability" text="Control when you’re open." />
            <Feature icon="🧠" title="No Infinite Scroll" text="Designed to prevent addiction." />
          </div>
        </section>
      </Reveal>

      {/* ================= HOW IT WORKS ================= */}
      <Reveal id="how">
        <section className="max-w-5xl mx-auto px-8 py-32">
          <h3 className="text-4xl font-bold text-center mb-20">
            How it works
          </h3>

          <div className="grid md:grid-cols-3 gap-10">
            <Step num="1" title="Set presence" text="Choose mood & availability." />
            <Step num="2" title="Discover people" text="Only real, available users appear." />
            <Step num="3" title="Start talking" text="Focused, short conversations." />
          </div>
        </section>
      </Reveal>

      {/* ================= ABOUT ================= */}
      <Reveal id="about">
        <section className="max-w-4xl mx-auto px-8 py-32 text-center">
          <h3 className="text-4xl font-bold mb-12">
            About Presence Grid
          </h3>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <AboutBlock
              title="Why we exist"
              text="Social platforms optimize for attention, not connection."
            />
            <AboutBlock
              title="What we’re building"
              text="A calmer, real-time space for human conversations."
            />
            <AboutBlock
              title="Current status"
              text="Actively building, testing, and refining."
            />
          </div>
        </section>
      </Reveal>

      {/* ================= FOUNDER ================= */}
      <Reveal>
        <section className="text-center px-8 pb-32">
          <img
            src="/founder.jpg"
            alt="Founder"
            className="w-40 h-40 rounded-full object-cover mx-auto ring-4 ring-indigo-400"
          />

          <h4 className="text-2xl font-semibold mt-6">
            Piyush Sharma
          </h4>

          <p className="opacity-80 mt-3 max-w-xl mx-auto">
            <h5>Founder of Presence Grid</h5> Building calmer,
            more human social spaces focused on presence,
            not performance.
          </p>

          <a
            href="https://instagram.com/piyyush.z"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-6 text-indigo-600 hover:underline"
          >
            Instagram
          </a>
        </section>
      </Reveal>

      {/* ================= FAQ ================= */}
      <Reveal id="faq">
        <section className="max-w-3xl mx-auto px-8 py-32">
          <h3 className="text-4xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h3>

          <div className="space-y-10">
            <QA q="Is this a dating app?" a="No. It’s about conversations, not matching." />
            <QA q="Why short sessions?" a="Short sessions create focus and reduce pressure." />
            <QA q="Is it anonymous?" a="You control what you share and when." />
            <QA q="Who is this for?" a="People tired of noisy social platforms." />
            <QA q="Can I choose availability?" a="Yes. Presence is intentional, not constant." />
          </div>
        </section>
      </Reveal>

      {/* ================= FOOTER ================= */}
      <footer className="py-12 text-center text-sm opacity-70">
        <button onClick={onOpenTerms} className="mx-3 hover:underline">
          Terms
        </button>
        <button onClick={onOpenPrivacy} className="mx-3 hover:underline">
          Privacy
        </button>
        <p className="mt-4">
          © {new Date().getFullYear()} Presence Grid
        </p>
      </footer>

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease;
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function Reveal({ children, id }) {
  const ref = useReveal();
  return (
    <div ref={ref} id={id} className="reveal">
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      className="
        p-8 rounded-2xl
        bg-white/80 dark:bg-slate-800/80
        border border-black/5 dark:border-white/10
        shadow-xl shadow-indigo-500/5
        hover:shadow-indigo-500/10
        transition
      "
    >
      {children}
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <Card>
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-slate-700 dark:text-slate-300">{text}</p>
    </Card>
  );
}

function Step({ num, title, text }) {
  return (
    <Card>
      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-4">
        {num}
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-slate-700 dark:text-slate-300">{text}</p>
    </Card>
  );
}

function AboutBlock({ title, text }) {
  return (
    <Card>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-slate-700 dark:text-slate-300 text-sm">{text}</p>
    </Card>
  );
}

function QA({ q, a }) {
  return (
    <div>
      <h5 className="font-semibold">{q}</h5>
      <p className="text-indigo-600 dark:text-indigo-300 text-sm">{a}</p>
    </div>
  );
}
