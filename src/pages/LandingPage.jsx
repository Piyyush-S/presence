import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const noop = () => {};

const AMBIENT = [
  "Someone is here right now",
  "A few people are present",
  "Pause is quiet",
  "No one around — that's fine",
];

const FEATURES = [
  { title: "Availability toggle", body: "You appear only when you choose to. Invisible by default." },
  { title: "Timed conversations", body: "Every conversation ends naturally. No dragging on forever." },
  { title: "No inbox pressure", body: "No unread counts. Nothing piles up while you're away." },
  { title: "Zero public metrics", body: "No likes, streaks, or follower counts. Not now, not ever." },
  { title: "Session-based chats", body: "Each conversation exists only in that moment." },
  { title: "Quiet presence", body: "See who's around without disturbing them." },
];

const BELIEFS = [
  ["Silence is valid", "Not replying immediately is a boundary, not a flaw."],
  ["Attention isn't currency", "No performance, no audience, no applause meter."],
  ["Presence is a choice", "You decide when you show up. Always."],
  ["Conversations can end", "Nothing here is designed to trap you."],
  ["Small is enough", "One real conversation beats a thousand notifications."],
  ["Calm beats clever", "No tricks. No dark patterns. No manipulation."],
];

const FAQS = [
  ["Is this a dating app?", "No. Pause is about conversation, not profiles or matching."],
  ["Why are conversations time-limited?", "Natural endings reduce pressure. Conversations feel lighter when they're allowed to finish."],
  ["What if I don't reply?", "Nothing. No penalties, no reminders, no streaks broken."],
  ["Is my availability public?", "Only when you choose to be present. Otherwise you're invisible."],
  ["Does this replace other social apps?", "No. Pause is meant to sit quietly alongside your life."],
];

function useAmbient() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % AMBIENT.length), 6000);
    return () => clearInterval(id);
  }, []);
  return AMBIENT[i];
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.v = "1"; obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function R({ children, d = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} style={{ "--d": `${d}ms` }} className="rev">
      {children}
    </div>
  );
}

export default function LandingPage({
  onLogin = noop,
  onSignup = noop,
  onOpenTerms = noop,
  onOpenPrivacy = noop,
}) {
  const { dark, toggleDark, theme } = useTheme();
  const ambient = useAmbient();
  const [openFaq, setOpenFaq] = useState(null);

  const { bg, fg, muted, border, card, accent } = theme;

  const W = { maxWidth: 1200, margin: "0 auto", padding: "0 40px" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Manrope:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Manrope', sans-serif; -webkit-font-smoothing: antialiased; }
        .rev {
          opacity: 0; transform: translateY(16px);
          transition: opacity .65s ease var(--d,0ms), transform .65s ease var(--d,0ms);
        }
        .rev[data-v="1"] { opacity: 1; transform: none; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .caret { display:inline-block; width:2px; height:.9em; background:currentColor; margin-left:3px; vertical-align:-1px; animation:blink 1.1s step-end infinite; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ background: bg, color: fg, minHeight: "100vh", transition: "background .3s, color .3s" }}>

        {/* NAV */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 200,
          background: bg, borderBottom: `1px solid ${border}`,
          transition: "background .3s, border-color .3s",
        }}>
          <div style={{ ...W, height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, letterSpacing: "-.01em" }}>
              pause
            </a>

            <div style={{ display: "flex", gap: 28 }}>
              {[["About","#about"],["Features","#features"],["Q&A","#faq"]].map(([label, href]) => (
                <a key={href} href={href} style={{ fontSize: 13, color: muted, transition: "color .2s", letterSpacing: ".01em" }}
                  onMouseEnter={e => e.target.style.color = fg}
                  onMouseLeave={e => e.target.style.color = muted}>
                  {label}
                </a>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={toggleDark} aria-label="toggle theme" style={{
                background: "none", border: `1px solid ${border}`, color: fg,
                width: 32, height: 32, borderRadius: 7, cursor: "pointer",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color .2s",
              }}>
                {dark ? "○" : "●"}
              </button>
              <button onClick={onLogin} style={{
                background: "none", border: "none", color: muted, cursor: "pointer",
                fontSize: 13, padding: "0 6px", transition: "color .2s",
              }}
                onMouseEnter={e => e.target.style.color = fg}
                onMouseLeave={e => e.target.style.color = muted}>
                Log in
              </button>
              <button onClick={onSignup} style={{
                background: fg, color: bg, border: "none",
                padding: "7px 16px", borderRadius: 7, cursor: "pointer",
                fontSize: 13, fontWeight: 500, transition: "opacity .2s",
              }}
                onMouseEnter={e => e.target.style.opacity = ".8"}
                onMouseLeave={e => e.target.style.opacity = "1"}>
                Get started
              </button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ ...W, padding: "110px 40px 90px" }}>
          <R>
            <div key={ambient} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: `1px solid ${border}`, borderRadius: 100,
              padding: "4px 14px", marginBottom: 48, fontSize: 12,
              color: muted, letterSpacing: ".04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, display: "inline-block" }} />
              {ambient}
            </div>
          </R>

          <R d={50}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(56px, 10vw, 120px)",
              lineHeight: 1.0, letterSpacing: "-.03em",
              maxWidth: 860, marginBottom: 32, fontWeight: 400,
            }}>
              Be present.<br />
              <em style={{ color: accent, fontStyle: "italic" }}>Not loud.</em>
              <span className="caret" />
            </h1>
          </R>

          <R d={100}>
            <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: muted, lineHeight: 1.8, maxWidth: 480, marginBottom: 44 }}>
              A real-time social space where conversations happen only when people are actually available.
            </p>
          </R>

          <R d={150}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={onSignup} style={{
                background: fg, color: bg, border: "none",
                padding: "13px 28px", borderRadius: 9, cursor: "pointer",
                fontSize: 14, fontWeight: 500, transition: "opacity .2s",
              }}
                onMouseEnter={e => e.target.style.opacity = ".8"}
                onMouseLeave={e => e.target.style.opacity = "1"}>
                Start calmly →
              </button>
              <button onClick={onLogin} style={{
                background: "none", color: muted, border: `1px solid ${border}`,
                padding: "13px 28px", borderRadius: 9, cursor: "pointer",
                fontSize: 14, transition: "color .2s, border-color .2s",
              }}
                onMouseEnter={e => { e.target.style.color = fg; e.target.style.borderColor = muted; }}
                onMouseLeave={e => { e.target.style.color = muted; e.target.style.borderColor = border; }}>
                Log in
              </button>
            </div>
          </R>
        </section>

        {/* TICKER */}
        <div style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, overflow: "hidden", padding: "13px 0" }}>
          <div style={{ display: "flex", gap: 56, animation: "ticker 20s linear infinite", width: "max-content" }}>
            {[...Array(6)].flatMap(() =>
              ["availability", "silence", "presence", "calm", "no metrics", "no pressure", "be here"]
            ).map((t, i) => (
              <span key={i} style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: muted, whiteSpace: "nowrap" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section id="about" style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "96px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <R>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(30px, 4vw, 52px)", lineHeight: 1.1, letterSpacing: "-.02em", fontWeight: 400 }}>
                Why Pause exists
              </h2>
            </R>
            <R d={70}>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.85, marginBottom: 18 }}>
                Most social platforms are built around speed, noise, and constant visibility. Reply fast. Stay visible. Keep up. Being online feels like a job you never applied for.
              </p>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.85 }}>
                Pause is built for the opposite. You appear only when you are available. Silence is never punished. Absence needs no explanation.
              </p>
            </R>
          </div>
        </section>

        {/* BELIEFS */}
        <section style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "96px 40px" }}>
            <R>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-.02em", fontWeight: 400, marginBottom: 56 }}>
                What Pause believes
              </h2>
            </R>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: `1px solid ${border}` }}>
              {BELIEFS.map(([title, body], i) => (
                <R key={i} d={i * 35}>
                  <div style={{
                    padding: "36px 32px",
                    borderRight: i % 3 !== 2 ? `1px solid ${border}` : "none",
                    borderBottom: i < 3 ? `1px solid ${border}` : "none",
                  }}>
                    <div style={{ fontSize: 11, color: accent, fontWeight: 500, marginBottom: 12, letterSpacing: ".08em" }}>0{i + 1}</div>
                    <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
                    <p style={{ fontSize: 13, color: muted, lineHeight: 1.75 }}>{body}</p>
                  </div>
                </R>
              ))}
            </div>
          </div>
        </section>

        {/* QUIET MOMENT */}
        <div style={{ borderBottom: `1px solid ${border}`, padding: "80px 40px", textAlign: "center", background: card }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "clamp(18px, 3vw, 30px)", color: muted, lineHeight: 2 }}>
            Most of the time, nothing happens here.<br />
            That's intentional.
          </p>
        </div>

        {/* FEATURES */}
        <section id="features" style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "96px 40px" }}>
            <R>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-.02em", fontWeight: 400, marginBottom: 52 }}>
                Features
              </h2>
            </R>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {FEATURES.map((f, i) => (
                <R key={i} d={i * 35}>
                  <div style={{
                    padding: "28px 24px", background: card,
                    border: `1px solid ${border}`, borderRadius: 10,
                    transition: "border-color .2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = muted}
                    onMouseLeave={e => e.currentTarget.style.borderColor = border}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: muted, lineHeight: 1.75 }}>{f.body}</p>
                  </div>
                </R>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "96px 40px" }}>
            <R>
              <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "52px 44px", borderRight: `1px solid ${border}` }}>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: muted, marginBottom: 28 }}>
                    Most social apps
                  </p>
                  {["Encourage constant activity", "Punish silence", "Never end conversations", "Measure worth with numbers", "Create anxiety around replies"].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                      <span style={{ color: muted, fontSize: 16, lineHeight: 1.4 }}>×</span>
                      <span style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "52px 44px", background: card }}>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: accent, marginBottom: 28 }}>
                    Pause
                  </p>
                  {["Rewards availability", "Protects silence", "Ends conversations by design", "No public metrics", "Doesn't demand attention"].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                      <span style={{ color: accent, fontSize: 14, lineHeight: 1.6 }}>✓</span>
                      <span style={{ fontSize: 14, lineHeight: 1.6 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </R>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "96px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <R>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-.02em", fontWeight: 400 }}>
                Questions
              </h2>
            </R>
            <div>
              {FAQS.map(([q, a], i) => (
                <R key={i} d={i * 35}>
                  <div style={{ borderTop: `1px solid ${border}` }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                      width: "100%", background: "none", border: "none", color: fg,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "20px 0", fontSize: 14, fontFamily: "inherit",
                      cursor: "pointer", textAlign: "left", gap: 16, fontWeight: 500,
                    }}>
                      <span>{q}</span>
                      <span style={{
                        color: muted, fontSize: 18, flexShrink: 0,
                        transform: openFaq === i ? "rotate(45deg)" : "none",
                        transition: "transform .25s", lineHeight: 1,
                      }}>+</span>
                    </button>
                    {openFaq === i && (
                      <p style={{ fontSize: 14, color: muted, lineHeight: 1.8, paddingBottom: 20 }}>{a}</p>
                    )}
                  </div>
                </R>
              ))}
              <div style={{ borderTop: `1px solid ${border}` }} />
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section style={{ background: fg, color: bg, padding: "100px 40px", textAlign: "center" }}>
          <R>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 6vw, 72px)", letterSpacing: "-.03em", fontWeight: 400, marginBottom: 20 }}>
              Ready to be quiet?
            </h2>
            <p style={{ fontSize: 16, opacity: .55, marginBottom: 44, lineHeight: 1.7 }}>
              Join Pause. Show up only when you want to.
            </p>
            <button onClick={onSignup} style={{
              background: bg, color: fg, border: "none",
              padding: "14px 32px", borderRadius: 9, cursor: "pointer",
              fontSize: 14, fontWeight: 500, transition: "opacity .2s",
            }}
              onMouseEnter={e => e.target.style.opacity = ".75"}
              onMouseLeave={e => e.target.style.opacity = "1"}>
              Start calmly →
            </button>
          </R>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${border}` }}>
          <div style={{ ...W, padding: "22px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17 }}>pause</span>
            <div style={{ display: "flex", gap: 24 }}>
              <button onClick={onOpenTerms} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Terms</button>
              <button onClick={onOpenPrivacy} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Privacy</button>
            </div>
            <span style={{ fontSize: 12, color: muted }}>© {new Date().getFullYear()} Pause</span>
          </div>
        </footer>

      </div>
    </>
  );
}
