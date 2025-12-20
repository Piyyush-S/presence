// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";

export default function LoginPage({ onLogin, onSwitch }) {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = identifier.trim();

      // If it's a username (no '@'), find the associated email
      if (!emailToUse.includes("@")) {
        const q = query(collection(db, "users"), where("username", "==", emailToUse));
        const snap = await getDocs(q);
        if (snap.empty) {
          alert("No account found with this username.");
          setLoading(false);
          return;
        }
        emailToUse = snap.docs[0].data().email;
      }

      // Sign in with resolved email
      await signInWithEmailAndPassword(auth, emailToUse, password);

      // Fetch user profile from Firestore
      const ref = doc(db, "users", emailToUse);
      const userSnap = await getDoc(ref);

      if (!userSnap.exists()) {
        alert("User profile not found.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      localStorage.setItem("presenceUser", JSON.stringify(userData));

      alert(`Welcome back, ${userData.name || "Friend"}!`);
      onLogin?.();
    } catch (err) {
      console.error("Login failed:", err);
      alert("Incorrect email/username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <form
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
          Welcome back 👋
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Log in to continue to Presence Grid.
        </p>

        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold shadow-md transition text-white ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg"
          }`}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </div>
  );
}
