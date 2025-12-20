// src/pages/SignupPage.jsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc, setDoc, getDocs, query, collection, where, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

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
    if (!email || !password || !uname) return setError("Please fill in all fields.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (uname.length < 3) return setError("Username must be at least 3 characters.");

    setLoading(true);
    try {
      // Ensure username unique
      const q = query(collection(db, "usernames"), where("username", "==", uname));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("This username is already taken. Try another one.");
        setLoading(false);
        return;
      }

      // Create auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      // Create user profile
      const userDoc = {
        email,
        username: uname,
        name: "",
        age: "",
        city: "",
        gender: "",
        mood: "",
        bio: "",
        aura: "#a78bfa",
        energy: 70,
        active: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
        img: "",
        discoverable: true,
      };
      await setDoc(doc(db, "users", email), userDoc);

      // 🔑 Create the public username index doc
      // doc ID as the username for O(1) lookup; also store fields for redundancy
      await setDoc(doc(db, "usernames", uname), {
        username: uname,
        email,
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("presenceUser", JSON.stringify(userDoc));
      alert("Verification email sent. Please check your inbox or spam folder.");
      onSignup?.();
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.code === "auth/email-already-in-use"
        ? "Email already in use. Try logging in."
        : (err.message || "Failed to create account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4">
      <form onSubmit={handleSignup}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg w-full max-w-md border border-white/30">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
          Create your Presence Grid account 🌱
        </h1>

        {error && <p className="bg-red-100 text-red-600 p-2 rounded-md text-sm mb-4">{error}</p>}

        <input type="email" placeholder="Email address" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" required />

        <input type="text" placeholder="Choose a username"
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" required />

        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" required />

        <input type="password" placeholder="Confirm password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full mb-6 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" required />

        <button type="submit" disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition text-white ${
            loading ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg"}`}>
          {loading ? "Creating Account ..." : "Sign Up"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <button type="button" onClick={onSwitch}
            className="text-indigo-600 font-medium hover:underline">
            Log in
          </button>
        </p>
      </form>
    </div>
  );
}
