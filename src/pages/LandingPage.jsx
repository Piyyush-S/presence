import React, { useEffect, useRef, useState } from "react";
import useDarkMode from "../hooks/useDarkMode";


const noop = () => {};

/* =====================================================
   UTIL: classNames helper
===================================================== */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* =====================================================
   AMBIENT PRESENCE (UI ONLY, NO LOGIC)
===================================================== */
function useAmbientPause() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const states = [
      "Someone is available right now",
      "A few people are present",
      "Pause is quiet",
      "No one is available — and that’s okay",
      null,
    ];

    const pick = () =>
      states[Math.floor(Math.random() * states.length)];

    setStatus(pick());
    const id = setInterval(() => setStatus(pick()), 8000);

    return () => clearInterval(id);
  }, []);

  return status;
}

/* =====================================================
   SCROLL REVEAL HOOK
===================================================== */
function useReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          if (once) observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return ref;
}

/* =====================================================
   REVEAL WRAPPER
===================================================== */
function Reveal({ id, children }) {
  const ref = useReveal();
  return (
    <div ref={ref} id={id} className="reveal">
      {children}
    </div>
  );
}

/* =====================================================
   SECTION WRAPPER
===================================================== */
function Section({ id, children, className }) {
  return (
    <section
      id={id}
      className={cn("py-28 md:py-36", className)}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {children}
      </div>
    </section>
  );
}

/* =====================================================
   TEXT BLOCK (used later everywhere)
===================================================== */
function TextBlock({ title, text, align = "center" }) {
  return (
    <div className={cn("max-w-5xl mx-auto", align === "center" && "text-center")}>
      {title && (
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-10">
          {title}
        </h3>
      )}
      <p className="text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

/* =====================================================
   DIVIDER (quiet visual separator)
===================================================== */
function Divider({ text }) {
  return (
    <div className="py-24 md:py-32 text-center text-base md:text-lg opacity-60">
      {text}
    </div>
  );
}
/* =====================================================
   LandingPage.jsx — PART 2 / 8
   Navbar + layout helpers
===================================================== */

/* =====================================================
   NAV LINK
===================================================== */
function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="
        opacity-70 hover:opacity-100
        transition-opacity
        cursor-pointer
      "
    >
      {children}
    </a>
  );
}

/* =====================================================
   NAVBAR BUTTON
===================================================== */
function NavButton({ onClick = noop, children, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition",
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "border border-black/20 dark:border-white/20 opacity-80 hover:opacity-100"
      )}
    >
      {children}
    </button>
  );
}

/* =====================================================
   THEME TOGGLE
===================================================== */
function ThemeToggle({ dark, toggleDark }) {
  return (
    <button
      onClick={toggleDark}
      aria-label="Toggle theme"
      className="
        p-2 rounded-lg
        border border-black/20 dark:border-white/20
        transition
      "
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

/* =====================================================
   NAVBAR
===================================================== */
function Navbar({
  dark,
  toggleDark,
  onLogin = noop,
  onSignup = noop,
}) {
  return (
    <nav
      className="
        sticky top-0 z-50
        backdrop-blur-xl
        bg-[#F8F6F6]/80 dark:bg-[#8a8583]/80
        border-b border-black/10 dark:border-white/10
      "
    >
      <div
        className="
          max-w-7xl mx-auto
          px-6 md:px-8
          h-20
          flex items-center justify-between
        "
      >
       {/* BRAND */}

<a
  href="/"
  className="flex items-center"
>
  <img
    src="/logo.png"
    alt="Pause"
    className="h-14 sm:h-16 w-auto select-none"
  />
</a>


        {/* DESKTOP LINKS */}
        <div className="hidden md:flex gap-12 text-lg font-medium">
          <NavLink href="#about">About</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#faq">Q&amp;A</NavLink>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <ThemeToggle dark={dark} toggleDark={toggleDark} />

          <button
            onClick={onLogin}
            className="
              hidden sm:inline
              text-sm
              opacity-70 hover:opacity-100
              transition-opacity
            "
          >
            Login
          </button>

          <NavButton onClick={onSignup} primary>
            Get Started
          </NavButton>
        </div>
      </div>
    </nav>
  );
}

/* =====================================================
   PAGE CONTAINER
===================================================== */
function PageContainer({ dark, children }) {
  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-700",
        dark
  ? "bg-[#0B0B0F] text-slate-100"
  : "bg-[#F7F4F4] text-slate-900"
      )}
    >
      {children}
    </div>
  );
}

/* =====================================================
   CENTERED CONTAINER
===================================================== */
function Centered({ children }) {
  return (
    <div className="relative max-w-3xl mx-auto text-center">
      {children}
    </div>
  );
}
/* =====================================================
   LandingPage.jsx — PART 3 / 8
   HERO SECTION
===================================================== */

/* =====================================================
   GLOW BACKGROUND
===================================================== */
function GlowBackground() {
  return (
    <>
      <div className="absolute w-[420px] h-[420px] bg-indigo-600/20 blur-[140px] rounded-full -top-32 -left-32" />
      <div className="absolute w-[360px] h-[360px] bg-purple-500/20 blur-[140px] rounded-full bottom-0 right-0" />
      <div className="absolute w-[260px] h-[260px] bg-pink-500/20 blur-[120px] rounded-full top-1/3 left-1/2 -translate-x-1/2" />
    </>
  );
}

/* =====================================================
   AMBIENT STATUS PILL
===================================================== */
function AmbientStatus({ text }) {
  if (!text) return null;

  return (
    <div className="mt-10 flex justify-center">
      <div
        className="
          px-5 py-3
          rounded-xl
          bg-white/70 dark:bg-white/5
          border border-black/10 dark:border-white/10
          backdrop-blur
        "
      >
        <span className="text-sm opacity-80">
          {text}
        </span>
      </div>
    </div>
  );
}

/* =====================================================
   HERO CTA BUTTON
===================================================== */
function HeroButton({ onClick, primary, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-10 py-4 rounded-xl font-semibold transition",
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}

/* =====================================================
   SCROLL HINT
===================================================== */
function ScrollHint() {
  return (
    <p className="mt-8 text-sm opacity-50">
      Scroll slowly ↓
    </p>
  );
}

/* =====================================================
   HERO SECTION
===================================================== */
function Hero({
  ambientStatus,
  onLogin = noop,
  onSignup = noop,
}) {
  return (
    <section
      className="
        relative
        min-h-[calc(100vh-80px)]
        flex items-center justify-center
        px-6 md:px-8
        overflow-hidden
      "
    >
      <GlowBackground />

      <Centered>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
          Be present.
          <br />
          <span className="text-indigo-500">
            Not loud.
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-2xl opacity-80">
          A real-time social space where conversations happen
          only when people are actually available.
        </p>

        <AmbientStatus text={ambientStatus} />

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <HeroButton onClick={onSignup} primary>
            Start calmly
          </HeroButton>

          <HeroButton onClick={onLogin}>
            Log in
          </HeroButton>
        </div>

        <ScrollHint />
      </Centered>
    </section>
  );
}
/* =====================================================
   LandingPage.jsx — PART 4 / 8
   ABOUT + PHILOSOPHY
===================================================== */

/* =====================================================
   ABOUT BLOCK
===================================================== */
function AboutSection() {
  return (
    <Section id="about">
      <div className="max-w-5xl mx-auto text-center">
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-10">
          Why Pause exists
        </h3>

        <p className="text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
          Most social platforms are built around speed, noise,
          and constant visibility.
        </p>

        <p className="mt-6 text-base sm:text-lg md:text-xl opacity-80 leading-relaxed">
          Pause is built for the opposite.
          You appear only when you are available.
          Silence is never punished.
        </p>
      </div>
    </Section>
  );
}

/* =====================================================
   PHILOSOPHY GRID ITEM
===================================================== */
function PhilosophyItem({ title, text }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">
        {title}
      </h4>
      <p className="opacity-80 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

/* =====================================================
   PHILOSOPHY SECTION
===================================================== */
function PhilosophySection() {
  return (
    <Reveal>
      <Section>
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
          A different way to be social
        </h3>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 text-base sm:text-lg leading-relaxed">
          <div className="space-y-6 opacity-80">
            <p>
              Most social apps are designed around attention.
              They reward activity, visibility, and reaction speed.
            </p>

            <p>
              Pause is designed around availability.
              You show up only when you choose to.
            </p>
          </div>

          <div className="space-y-6 opacity-80">
            <p>
              Silence is not failure here.
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
  );
}

/* =====================================================
   BELIEF GRID
===================================================== */
function BeliefGrid() {
  const beliefs = [
    ["Silence is valid", "Not replying immediately is a boundary, not a flaw."],
    ["Attention isn’t currency", "No likes, streaks, or public performance."],
    ["Availability is intentional", "Presence is always a choice."],
    ["Conversations can end", "Nothing is designed to trap you."],
    ["Small is okay", "Quality moments matter more than scale."],
    ["Calm beats clever", "No tricks, no dark patterns."],
  ];

  return (
    <Reveal>
      <Section>
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
          What Pause believes
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12 text-base sm:text-lg">
          {beliefs.map(([title, text], i) => (
            <PhilosophyItem
              key={i}
              title={title}
              text={text}
            />
          ))}
        </div>
      </Section>
    </Reveal>
  );
}

/* =====================================================
   QUIET DIVIDER
===================================================== */
function QuietDivider() {
  return (
    <Divider text={
      <>
        Most of the time, nothing happens here.
        <br />
        That’s intentional.
      </>
    } />
  );
}
/* =====================================================
   LandingPage.jsx — PART 5 / 8
   FEATURES + COMPARISON
===================================================== */

/* =====================================================
   FEATURE CARD
===================================================== */
function FeatureCard({ title, description }) {
  return (
    <div
      className="
        rounded-2xl p-10
        bg-[#F8F6F6] dark:bg-[#2A2A2E]
        border border-black/10 dark:border-white/10
        shadow-sm
        transition
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <h4 className="text-xl md:text-2xl font-semibold mb-4 text-black dark:text-white">
        {title}
      </h4>

      <p className="text-base md:text-lg leading-relaxed text-black/70 dark:text-white/70">
        {description}
      </p>
    </div>
  );
}

/* =====================================================
   FEATURES SECTION
===================================================== */
function FeaturesSection() {
  const features = [
    {
      title: "Availability toggle",
      description:
        "Go present only when you want to talk. Stay invisible otherwise.",
    },
    {
      title: "Timed conversations",
      description:
        "Every conversation ends naturally. No dragging, no pressure.",
    },
    {
      title: "No unread pressure",
      description:
        "No message counts, no inbox anxiety, nothing piling up.",
    },
    {
      title: "Zero public metrics",
      description:
        "No likes, followers, streaks, or visible numbers.",
    },
    {
      title: "Session-based chats",
      description:
        "Each interaction exists only in the moment.",
    },
    {
      title: "Quiet presence",
      description:
        "See who is available without interrupting them.",
    },
  ];

  return (
    <Section id="features">
      <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-20 text-center">
        Features
      </h3>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
        {features.map((f, i) => (
          <FeatureCard
            key={i}
            title={f.title}
            description={f.description}
          />
        ))}
      </div>
    </Section>
  );
}

/* =====================================================
   COMPARISON COLUMN
===================================================== */
function ComparisonColumn({ title, items, highlight }) {
  return (
    <div>
      <h4
        className={cn(
          "text-2xl sm:text-3xl font-semibold mb-8",
          highlight && "text-indigo-500"
        )}
      >
        {title}
      </h4>

      <ul className="space-y-4 text-base sm:text-lg opacity-80">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

/* =====================================================
   COMPARISON SECTION
===================================================== */
function ComparisonSection() {
  return (
    <Reveal>
      <Section>
        <div className="grid md:grid-cols-2 gap-16 md:gap-28">
          <ComparisonColumn
            title="Most social apps"
            items={[
              "Encourage constant activity",
              "Punish silence",
              "Never let conversations end",
              "Measure worth with numbers",
              "Create anxiety around replies",
            ]}
          />

          <ComparisonColumn
            title="Pause"
            highlight
            items={[
              "Rewards availability",
              "Protects silence",
              "Ends conversations intentionally",
              "No public metrics",
              "Does not demand attention",
            ]}
          />
        </div>
      </Section>
    </Reveal>
  );
}
/* =====================================================
   LandingPage.jsx — PART 6 / 8
   TIMELINE + SCENARIOS
===================================================== */

/* =====================================================
   TIMELINE ROW
===================================================== */
function TimelineRow({ time, text }) {
  return (
    <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] gap-6 sm:gap-10">
      <div className="font-medium">{time}</div>
      <div className="opacity-80 leading-relaxed">{text}</div>
    </div>
  );
}

/* =====================================================
   TIMELINE SECTION
===================================================== */
function TimelineSection() {
  return (
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
  );
}

/* =====================================================
   SCENARIO CARD
===================================================== */
function ScenarioCard({ question, answer }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{question}</h4>
      <p className="opacity-80 leading-relaxed">{answer}</p>
    </div>
  );
}

/* =====================================================
   SCENARIOS SECTION
===================================================== */
function ScenariosSection() {
  const scenarios = [
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
  ];

  return (
    <Reveal>
      <Section>
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
          What happens when…
        </h3>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto text-base sm:text-lg">
          {scenarios.map((s, i) => (
            <ScenarioCard
              key={i}
              question={s.q}
              answer={s.a}
            />
          ))}
        </div>
      </Section>
    </Reveal>
  );
}
/* =====================================================
   LandingPage.jsx — PART 7 / 8
   FAQ + FOUNDER
===================================================== */

/* =====================================================
   FAQ ITEM
===================================================== */
function FAQItem({ question, answer }) {
  return (
    <details className="group py-6">
      <summary
        className="
          flex justify-between items-center
          cursor-pointer list-none
          text-base sm:text-lg font-medium
        "
      >
        {question}
        <span className="transition group-open:rotate-180">⌄</span>
      </summary>

      <p className="mt-4 opacity-80 leading-relaxed">
        {answer}
      </p>
    </details>
  );
}

/* =====================================================
   FAQ SECTION
===================================================== */
function FAQSection() {
  const faqs = [
    {
      q: "Is this a dating app?",
      a: "No. Pause is about conversations, not matching, swiping, or competing profiles.",
    },
    {
      q: "Why are conversations time-limited?",
      a: "Natural endings reduce pressure. Conversations feel lighter when they are allowed to end.",
    },
    {
      q: "What if I don’t reply?",
      a: "Nothing happens. There are no penalties, streaks, or reminders.",
    },
    {
      q: "Is my availability public?",
      a: "Only when you choose to be present. Otherwise, you are invisible.",
    },
    {
      q: "Is this meant to replace other social apps?",
      a: "No. Pause is designed to sit quietly alongside your life.",
    },
  ];

  return (
    <Reveal>
      <Section id="faq">
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-16 text-center">
          Frequently asked questions
        </h3>

        <div className="max-w-3xl mx-auto divide-y divide-black/10 dark:divide-white/10">
          {faqs.map((f, i) => (
            <FAQItem
              key={i}
              question={f.q}
              answer={f.a}
            />
          ))}
        </div>
      </Section>
    </Reveal>
  );
}

/* =====================================================
   FOUNDER SECTION
===================================================== */
function FounderSection() {
  return (
    <Reveal>
      <Section id="founder">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="space-y-6 text-base sm:text-lg opacity-80 leading-relaxed">
            <p>
              Hi, I’m <span className="font-medium">Piyush Sharma</span>.
            </p>

            <p>
              I started building Pause because most social apps feel loud and rushed.
               There’s always pressure to reply fast,
              stay visible, and keep up, like being online is a job you never applied for.
            </p>

            <p>
              I wanted something quieter. A place where its okay to be unavailable.
               Where conversations can breathe, and silence isn’t awkward or punished.
            </p>

            <p>
              Pause is my attempt to create that space.
              It’s slow by design, and that’s the point.
            </p>

            <a
              href="https://instagram.com/piyyush.z"
              target="_blank"
              rel="noreferrer"
              className="
                inline-block mt-6
                text-indigo-500 font-medium
                hover:underline
              "
            >
              Follow the build on Instagram →
            </a>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              
              <img
                src="/founder.jpg"
                alt="Piyush Sharma"
                className="
                  relative
                  w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72
                  rounded-full object-cover
                  border border-black/10 dark:border-white/10
                  shadow-2xl
                "
              />
            </div>
          </div>
        </div>
      </Section>
    </Reveal>
  );
}
/* =====================================================
   LandingPage.jsx — PART 8 / 8
   FOOTER + STYLES + FINAL EXPORT
===================================================== */

/* =====================================================
   FOOTER
===================================================== */
function Footer({ onOpenTerms = noop, onOpenPrivacy = noop }) {
  return (
    <footer className="py-16 border-t border-black/10 dark:border-white/10">
      <div
        className="
          max-w-6xl mx-auto
          px-6 md:px-8
          flex flex-col md:flex-row
          justify-between items-center
          gap-6
          text-sm opacity-70
        "
      >
        <p>© {new Date().getFullYear()} Pause</p>

        <div className="flex gap-6">
          <button
            onClick={onOpenTerms}
            className="hover:underline"
          >
            Terms
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:underline"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
}

/* =====================================================
   GLOBAL REVEAL STYLES
===================================================== */
function RevealStyles() {
  return (
    <style>{`
      .reveal {
        opacity: 0;
        transform: translateY(28px);
        transition:
          opacity 0.8s ease,
          transform 0.8s ease;
      }

      .reveal-visible {
        opacity: 1;
        transform: translateY(0);
      }

      html {
        scroll-behavior: smooth;
      }
    `}</style>
  );
}

/* =====================================================
   FINAL LANDING PAGE EXPORT
===================================================== */
export default function LandingPage({
  onLogin = noop,
  onSignup = noop,
  onOpenTerms = noop,
  onOpenPrivacy = noop,
}) {
  const [dark, toggleDark] = useDarkMode();
  const ambientStatus = useAmbientPause();

  return (
    <PageContainer dark={dark}>
      {/* NAVBAR */}
      <Navbar
        dark={dark}
        toggleDark={toggleDark}
        onLogin={onLogin}
        onSignup={onSignup}
      />

      {/* HERO */}
      <Hero
        ambientStatus={ambientStatus}
        onLogin={onLogin}
        onSignup={onSignup}
      />

      {/* ABOUT */}
      <AboutSection />

      {/* PHILOSOPHY */}
      <PhilosophySection />

      {/* BELIEFS */}
      <BeliefGrid />

      {/* QUIET DIVIDER */}
      <QuietDivider />

      {/* FEATURES */}
      <FeaturesSection />

      {/* COMPARISON */}
      <ComparisonSection />

      {/* TIMELINE */}
      <TimelineSection />

      {/* SCENARIOS */}
      <ScenariosSection />

      {/* FAQ */}
      <FAQSection />

      {/* FOUNDER */}
      <FounderSection />

      {/* FOOTER */}
      <Footer
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />

      {/* STYLES */}
      <RevealStyles />
    </PageContainer>
  );
}
