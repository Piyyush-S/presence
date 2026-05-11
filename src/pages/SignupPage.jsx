import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
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

function PasswordInput({ placeholder, value, onChange, style, muted }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...style, paddingRight: 44 }}
        required
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: muted,
          display: "flex", alignItems: "center", padding: 0, transition: "color .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = style.color}
        onMouseLeave={e => e.currentTarget.style.color = muted}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function SignupPage({ onSignup, onSwitch, dark = true }) {
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    const uname = username.trim().toLowerCase();

    if (!email || !password || !uname)
      return setMsg({ text: "Please fill in all fields.", type: "error" });
    if (password !== confirm)
      return setMsg({ text: "Passwords do not match.", type: "error" });
    if (uname.length < 3)
      return setMsg({ text: "Username must be at least 3 characters.", type: "error" });

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      sendEmailVerification(cred.user).catch(() => {});
      localStorage.setItem("presenceUser", JSON.stringify({ email, username: uname }));
      onSignup?.();
    } catch (err) {
      setMsg({
        text: err.code === "auth/email-already-in-use"
          ? "Email already in use. Try logging in."
          : "Signup failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
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
              background: "none", border: `1px solid ${border}`, color: muted,
              padding: "7px 16px", borderRadius: 7, cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", transition: "color .2s, border-color .2s",
            }}
              onMouseEnter={e => { e.target.style.color = fg; e.target.style.borderColor = muted; }}
              onMouseLeave={e => { e.target.style.color = muted; e.target.style.borderColor = border; }}>
              Log in
            </button>
          </div>
        </nav>

        {/* BODY */}
        <div className="split-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 40px" }}>

          {/* LEFT */}
          <div className="left-col" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 64px 80px 0", borderRight: `1px solid ${border}` }}>
            <div className="fu1">
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: accent, marginBottom: 28 }}>
                Create your account
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(34px, 3.5vw, 54px)", lineHeight: 1.08, letterSpacing: "-.03em", fontWeight: 400, marginBottom: 24 }}>
                A calmer way<br />
                to <em style={{ fontStyle: "italic", color: accent }}>connect.</em>
              </h1>
              <p style={{ fontSize: 15, color: muted, lineHeight: 1.85, maxWidth: 380, marginBottom: 52 }}>
                Pause is built for intentional conversations. No feeds, no likes, no pressure to perform. Just presence, when you choose it.
              </p>
            </div>

            <div className="fu2" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                ["01", "No ads, no spam, no algorithmic noise"],
                ["02", "Talk only when you are actually available"],
                ["03", "Conversations end naturally, nothing lingers"],
                ["04", "Delete your account anytime, instantly"],
              ].map(([num, text]) => (
                <div key={num} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, color: accent, fontWeight: 500, letterSpacing: ".06em", marginTop: 2, flexShrink: 0 }}>{num}</span>
                  <span style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{text}</span>
                </div>
              ))}
            </div>

            <div className="fu2" style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${border}` }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 16, color: muted, lineHeight: 1.75 }}>
                "Silence is not failure here."
              </p>
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="right-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0 80px 64px" }}>
            <div className="fu3" style={{ width: "100%", maxWidth: 400 }}>

              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 400, letterSpacing: "-.02em", marginBottom: 8 }}>
                Join Pause
              </h2>
              <p style={{ fontSize: 13, color: muted, marginBottom: 36 }}>
                One account. No noise attached.
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

              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={inputStyle}
                  required
                />

                <PasswordInput
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  muted={muted}
                />

                <PasswordInput
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                  muted={muted}
                />

                <p style={{ fontSize: 11, color: muted, lineHeight: 1.6, marginTop: 2 }}>
                  Use 8 or more characters. Mix letters and numbers for a stronger password.
                </p>

                <button type="submit" disabled={loading} style={{
                  width: "100%", background: loading ? muted : fg, color: bg,
                  border: "none", padding: "13px", borderRadius: 9,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                  transition: "opacity .2s", marginTop: 8,
                }}
                  onMouseEnter={e => { if (!loading) e.target.style.opacity = ".8"; }}
                  onMouseLeave={e => e.target.style.opacity = "1"}>
                  {loading ? "Creating account..." : "Create account"}
                </button>

              </form>

              <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: muted }}>
                Already have an account?{" "}
                <button onClick={onSwitch} style={{
                  background: "none", border: "none", color: fg, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}>
                  Log in
                </button>
              </p>

              <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: muted, lineHeight: 1.7 }}>
                No ads. No spam. Delete your account anytime.
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
