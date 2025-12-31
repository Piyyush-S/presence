// src/pages/SignupPage.jsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase";

export default function SignupPage({ onSignup, onSwitch }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const uname = username.trim().toLowerCase();

    if (!email || !password || !uname)
      return setError("Please fill in all fields.");
    if (password !== confirm)
      return setError("Passwords do not match.");
    if (uname.length < 3)
      return setError("Username must be at least 3 characters.");

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      sendEmailVerification(cred.user).catch(() => {});

      localStorage.setItem(
        "presenceUser",
        JSON.stringify({
          email,
          username: uname,
        })
      );

      onSignup?.();
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email already in use. Try logging in."
          : "Signup failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-6
        bg-gradient-to-br
        from-white via-indigo-50 to-purple-50
        transition-colors duration-700
      "
    >
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
        {/* ================= LEFT CONTENT ================= */}
        <div className="hidden md:block">
          <h1 className="text-4xl font-bold mb-6">
            A calmer way to connect
          </h1>

          <p className="text-lg text-slate-600 mb-6 max-w-md">
            Presence Grid is built for intentional conversations —
            not likes, not feeds, not endless scrolling.
          </p>

          <ul className="space-y-3 text-slate-700">
            <li>• No ads. No spam. No pressure</li>
            <li>• Talk only when you’re actually available</li>
            <li>• Designed to reduce noise, not create it</li>
          </ul>
        </div>

        {/* ================= SIGNUP CARD ================= */}
        <form
          onSubmit={handleSignup}
          className="
            bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto
          "
        >
          <h2 className="text-2xl font-bold text-indigo-600 text-center mb-2">
            Create your Presence Grid account 🌱
          </h2>

          <p className="text-center text-sm text-slate-500 mb-6">
            Start with intention. Leave whenever you want.
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
            className="w-full mb-4 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full mb-6 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

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
            {loading ? "Creating account…" : "Sign Up"}
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            No ads • No spam • Delete your account anytime
          </p>

          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitch}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
