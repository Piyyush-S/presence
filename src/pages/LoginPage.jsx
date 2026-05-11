import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage({ onLogin, onSwitch, dark = true }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const bg     = dark ? "#000000" : "#ffffff";
  const fg     = dark ? "#ffffff" : "#000000";
  const muted  = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const card   = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const accent = dark ? "#7B9EFF" : "#2B4FFF";

  const inputStyle = {
    width: "100%", background: card, border: `1px solid ${border}`,
    color: fg, borderRadius: 9, padding: "13px 16px", fontSize: 14,
    fontFamily: "inherit", outline: "none", transition: "border-color .2s",
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("presenceUser", JSON.stringify({ uid: cred.user.uid, email: cred.user.email }));
      onLogin?.();
    } catch {
      setMsg({ text: "Invalid email or password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setMsg({ text: "Enter your email first.", type: "error" }); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg({ text: "Password reset email sent.", type: "ok" });
    } catch {
      setMsg({ text: "Failed to send reset email.", type: "error" });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Manrope:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Manrope', sans-serif; -webkit-font-smoothing: antialiased; }
        input::placeholder { color: ${muted}; }
        input:focus { border-color: ${accent} !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        .fu1 { animation: fadeUp .55s ease both; }
        .fu2 { animation: fadeUp .55s .08s ease both; }
        .fu3 { animation: fadeUp .55s .16s ease both; }
        @media (max-width: 768px) {
          .split-grid { grid-template-columns: 1fr !important; }
          .left-col { display: none !important; }
          .right-col { padding: 60px 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: bg, color: fg, display: "flex", flexDirection: "column" }}>

        {/* NAV */}
        <nav style={{ borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: fg, textDecoration: "none", letterSpacing: "-.01em" }}>
              pause
            </a>
            <button onClick={onSwitch} style={{
              background: fg, color: bg, border: "none",
              padding: "7px 16px", borderRadius: 7, cursor: "pointer",
              fontSize: 13, fontWeight: 500, fontFamily: "inherit", transition: "opacity .2s",
            }}
              onMouseEnter={e => e.target.style.opacity = ".8"}
              onMouseLeave={e => e.target.style.opacity = "1"}>
              Sign up
            </button>
          </div>
        </nav>

        {/* BODY */}
        <div className="split-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 40px" }}>

          {/* LEFT */}
          <div className="left-col" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 64px 80px 0", borderRight: `1px solid ${border}` }}>
            <div className="fu1">
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: accent, marginBottom: 28 }}>
                Welcome back
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4vw, 58px)", lineHeight: 1.08, letterSpacing: "-.03em", fontWeight: 400, marginBottom: 24 }}>
                Good to see<br />
                <em style={{ fontStyle: "italic", color: accent }}>you again.</em>
              </h1>
              <p style={{ fontSize: 15, color: muted, lineHeight: 1.85, maxWidth: 380, marginBottom: 48 }}>
                Continue calm, intentional conversations without noise, pressure, or endless scrolling.
              </p>
            </div>

            <div className="fu2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                ["01", "Talk only when you are actually available"],
                ["02", "Short, focused conversations that end naturally"],
                ["03", "Designed to feel human, not addictive"],
              ].map(([num, text]) => (
                <div key={num} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, color: accent, fontWeight: 500, letterSpacing: ".06em", marginTop: 2, flexShrink: 0 }}>{num}</span>
                  <span style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="right-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0 80px 64px" }}>
            <div className="fu3" style={{ width: "100%", maxWidth: 400 }}>

              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 400, letterSpacing: "-.02em", marginBottom: 8 }}>
                Log in
              </h2>
              <p style={{ fontSize: 13, color: muted, marginBottom: 36 }}>
                Enter your credentials to continue.
              </p>

              {msg.text && (
                <div style={{
                  marginBottom: 20, padding: "11px 16px", borderRadius: 8, fontSize: 13,
                  background: msg.type === "error"
                    ? (dark ? "rgba(255,80,80,0.1)" : "rgba(200,0,0,0.06)")
                    : (dark ? "rgba(100,255,150,0.1)" : "rgba(0,160,80,0.06)"),
                  border: `1px solid ${msg.type === "error" ? "rgba(255,80,80,0.2)" : "rgba(100,255,150,0.2)"}`,
                  color: msg.type === "error" ? (dark ? "#FF8080" : "#CC0000") : (dark ? "#80FFA0" : "#006030"),
                }}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />

                {/* PASSWORD WITH EYE */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: muted,
                      display: "flex", alignItems: "center", padding: 0, transition: "color .2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = fg}
                    onMouseLeave={e => e.currentTarget.style.color = muted}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>

                <div style={{ textAlign: "right", marginTop: -4 }}>
                  <button type="button" onClick={handleForgot} style={{
                    background: "none", border: "none", color: muted, cursor: "pointer",
                    fontSize: 12, fontFamily: "inherit", transition: "color .2s",
                  }}
                    onMouseEnter={e => e.target.style.color = fg}
                    onMouseLeave={e => e.target.style.color = muted}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", background: loading ? muted : fg, color: bg,
                  border: "none", padding: "13px", borderRadius: 9,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                  transition: "opacity .2s", marginTop: 6,
                }}
                  onMouseEnter={e => { if (!loading) e.target.style.opacity = ".8"; }}
                  onMouseLeave={e => e.target.style.opacity = "1"}>
                  {loading ? "Logging in..." : "Log in"}
                </button>

              </form>

              <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: muted }}>
                No account?{" "}
                <button onClick={onSwitch} style={{
                  background: "none", border: "none", color: fg, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}>
                  Sign up
                </button>
              </p>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>pause</span>
            <span style={{ fontSize: 12, color: muted }}>© {new Date().getFullYear()} Pause</span>
          </div>
        </footer>

      </div>
    </>
  );
}
