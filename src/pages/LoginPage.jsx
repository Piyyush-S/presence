// src/pages/LoginPage.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";

export default function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      localStorage.setItem(
        "presenceUser",
        JSON.stringify({ email: cred.user.email })
      );

      onLogin?.();
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("Password reset email sent.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email.");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-6
        bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50
      "
    >
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-16 items-center">
        {/* ================= LEFT CONTENT ================= */}
        <div>
          <h1 className="text-4xl font-bold mb-6">
            Welcome back
          </h1>

          <p className="text-lg text-slate-700 mb-6 max-w-md">
            Continue calm, intentional conversations —
            without noise, pressure, or endless scrolling.
          </p>

          <ul className="space-y-3 text-sm text-slate-700">
            <li>• Talk only when you’re actually available</li>
            <li>• Short, focused conversations</li>
            <li>• Designed to feel human, not addictive</li>
          </ul>
        </div>

        {/* ================= LOGIN CARD ================= */}
        <form
          onSubmit={handleLogin}
          className="
            w-full max-w-md mx-auto
            bg-white rounded-3xl p-8
            shadow-2xl
          "
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-indigo-600">
            Welcome back 👋
          </h2>

          <p className="text-center text-sm text-slate-600 mb-6">
            Continue calm, intentional conversations.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full mb-4 p-3 rounded-xl border
              border-slate-200
              placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full mb-3 p-3 rounded-xl border
              border-slate-200
              placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
            required
          />

          <div className="text-right mb-6">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-xl font-semibold text-white transition
              ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90"
              }
            `}
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          <p className="text-center mt-6 text-sm text-slate-700">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={onSwitch}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
