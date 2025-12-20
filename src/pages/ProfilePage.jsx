// src/pages/ProfilePage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfilePage({ onBack }) {
  const [userData, setUserData] = useState(null);
  const [newName, setNewName] = useState("");
  const [newMood, setNewMood] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newEnergy, setNewEnergy] = useState(null);
  const [discoverable, setDiscoverable] = useState(true);
  const [saving, setSaving] = useState(false);

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser?.email) return;
      try {
        const ref = doc(db, "users", currentUser.email);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setNewName(data.name || "");
          setNewMood(data.mood || "");
          setDiscoverable(data.discoverable ?? true);
          const energyNum = toNumOrDefault(data.energy, 60);
          setNewEnergy(energyNum);
        } else {
          setUserData({ email: currentUser.email });
          setNewEnergy(60);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };
    fetchUser();
  }, [currentUser?.email]);

  const toNumOrDefault = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  const moodOptions = useMemo(
    () => [
      "Calm ☁️",
      "Curious 🔍",
      "Energetic ⚡",
      "Lonely 💭",
      "Open to Talk 💬",
      "Grateful 🌻",
      "Overwhelmed 🌊",
      "Lost 💫",
    ],
    []
  );

  const handleSave = async () => {
    if (!currentUser?.email) return;
    setSaving(true);
    try {
      const energyNum = toNumOrDefault(newEnergy, 60);
      const ref = doc(db, "users", currentUser.email);
      const updatedData = {
        name: newName,
        mood: newMood,
        img: newProfilePic || userData?.img || "",
        energy: energyNum,
        discoverable,
      };
      await updateDoc(ref, updatedData);

      const merged = { ...(userData || {}), ...updatedData, email: currentUser.email };
      setUserData(merged);
      localStorage.setItem("presenceUser", JSON.stringify(merged));

      alert("✅ Profile updated successfully!");
      onBack?.();
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("⚠️ Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!userData || newEnergy === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-gray-600 text-lg animate-pulse">Loading Profile…</p>
      </div>
    );
  }

  const energyDisplay = toNumOrDefault(newEnergy, 60);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-indigo-700 mb-6"
      >
        Edit Profile 🌿
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md text-center border border-white/30"
      >
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <img
            src={newProfilePic || userData?.img || `https://i.pravatar.cc/150?u=${userData.email}`}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover mx-auto"
          />
          <label className="absolute bottom-0 right-2 bg-indigo-500 text-white rounded-full p-1 text-xs cursor-pointer hover:bg-indigo-600">
            📷
            <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
          </label>
        </div>

        {/* Name */}
        <input
          type="text"
          placeholder="Your name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full mt-4 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none text-gray-700"
        />

        {/* Mood */}
        <select
          value={newMood}
          onChange={(e) => setNewMood(e.target.value)}
          className="w-full mt-4 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none text-gray-700"
        >
          <option value="">Select your current mood</option>
          {moodOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Energy */}
        <div className="mt-5 w-full text-left">
          <label className="block text-sm font-medium text-gray-600 mb-1">Energy Level ⚡</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNewEnergy((v) => Math.max(0, toNumOrDefault(v, 60) - 5))}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
            >
              –
            </button>
            <input
              type="range"
              value={energyDisplay}
              onChange={(e) => setNewEnergy(Number(e.target.value))}
              onInput={(e) => setNewEnergy(Number(e.target.value))}
              min="0"
              max="100"
              step="1"
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setNewEnergy((v) => Math.min(100, toNumOrDefault(v, 60) + 5))}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{energyDisplay}%</p>
        </div>

        {/* Discoverable */}
        <div className="flex items-center mt-5 gap-2 justify-start">
          <input
            type="checkbox"
            id="discoverable"
            checked={discoverable}
            onChange={(e) => setDiscoverable(e.target.checked)}
            className="w-4 h-4 text-indigo-600 accent-indigo-500 focus:ring-indigo-400 rounded"
          />
          <label htmlFor="discoverable" className="text-sm text-gray-700 select-none">
            Show me on global Presence Grid 🌍
          </label>
        </div>

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className={`w-full mt-6 py-3 rounded-2xl font-semibold shadow-md transition ${
            saving
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-xl"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </motion.button>

        {/* Back */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-white text-indigo-600 rounded-full shadow hover:shadow-md font-medium border border-indigo-100"
        >
          ← Back to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}
