import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Lock } from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AmbientBackground from "../components/AmbientBackground";

export default function UserInfoForm({ email, onComplete }) {
  const { dark, toggleDark, theme } = useTheme();
  const storedUser = JSON.parse(localStorage.getItem("presenceUser") || "{}");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const inputStyle = {
    width: "100%",
    background: theme.card,
    border: `1px solid ${theme.border}`,
    color: theme.fg,
    borderRadius: 9,
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    outline: "none",
    transition: "border-color .2s",
  };

  const syncToFirebase = async (profile) => {
    try {
      let imgUrl = profile.img || "";

      if (imgFile) {
        const storage = getStorage();
        const imgRef = ref(storage, `profilePics/${email}`);
        await uploadBytes(imgRef, imgFile);
        imgUrl = await getDownloadURL(imgRef);
      }

      await setDoc(
        doc(db, "users", email),
        {
          ...profile,
          img: imgUrl,
          active: true,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Firebase profile sync skipped/failed:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setToastMsg("Please fill in your name and city.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    setLoading(true);
    setToastMsg("Setting up your space…");

    const profile = {
      email,
      username: storedUser.username || email?.split("@")[0] || "user",
      name: name.trim(),
      age: age ? Number(age) : "",
      city: city.trim(),
      gender: gender || "",
      img: preview || "",
      mood: "Calm ☁️",
      discoverable: true,
    };

    localStorage.setItem("presenceUser", JSON.stringify(profile));

    try {
      await syncToFirebase(profile);
    } catch (_) {}

    setLoading(false);
    onComplete?.();
  };

  const initialLetter = name ? name[0].toUpperCase() : (storedUser.username?.[0] || "P").toUpperCase();

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-300 px-6 py-8 relative"
      style={{ background: theme.bg, color: theme.fg }}
    >
      <AmbientBackground />

      {/* Top bar */}
      <nav className="max-w-md mx-auto w-full flex items-center justify-between">
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            letterSpacing: "-.01em",
            color: theme.fg,
          }}
        >
          pause
        </span>
        <button
          onClick={toggleDark}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            color: theme.muted,
          }}
        >
          {dark ? "light" : "dark"}
        </button>
      </nav>

      {/* Main card */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        <div
          className="p-8 sm:p-10 rounded-2xl transition-all"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="text-center mb-8">
            <span
              className="text-[11px] uppercase tracking-widest block mb-2 font-medium"
              style={{ color: theme.accent }}
            >
              Step 2 of 2 — Profile
            </span>
            <h1
              className="text-2xl sm:text-3xl font-normal tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How you appear
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
              A quiet identity. Only shared when you choose to be present.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <label className="relative cursor-pointer group">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:opacity-90"
                  style={{
                    background: dark ? "rgba(123, 158, 255, 0.14)" : "rgba(43, 79, 255, 0.09)",
                    border: `1.5px solid ${dark ? "rgba(123, 158, 255, 0.3)" : "rgba(43, 79, 255, 0.25)"}`,
                  }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-2xl font-semibold"
                      style={{
                        color: theme.accent,
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {initialLetter}
                    </span>
                  )}
                </div>

                <div
                  className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-md transition-transform group-hover:scale-110"
                  style={{
                    background: theme.fg,
                    color: theme.bg,
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={13} />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImgFile(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              <span className="text-[11px] mt-2" style={{ color: theme.muted }}>
                Optional profile picture
              </span>
            </div>

            {/* Username (locked) */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: theme.muted }}>
                Username
              </label>
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.muted,
                }}
              >
                <span className="text-sm font-medium">@{storedUser.username || "username"}</span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: theme.mutedMore }}>
                  <Lock size={12} />
                  Permanent
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: theme.muted }}>
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Maya Lin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* City & Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.muted }}>
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.muted }}>
                  Age
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: theme.muted }}>
                Gender <span className="text-[11px]" style={{ color: theme.mutedMore }}>(optional)</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={inputStyle}
              >
                <option value="" style={{ background: theme.bg, color: theme.fg }}>
                  Select gender
                </option>
                <option value="male" style={{ background: theme.bg, color: theme.fg }}>
                  Male
                </option>
                <option value="female" style={{ background: theme.bg, color: theme.fg }}>
                  Female
                </option>
                <option value="other" style={{ background: theme.bg, color: theme.fg }}>
                  Other / Non-binary
                </option>
                <option value="prefer_not" style={{ background: theme.bg, color: theme.fg }}>
                  Prefer not to say
                </option>
              </select>
            </div>

            {/* Toast msg */}
            {toastMsg && (
              <p className="text-xs text-center font-medium" style={{ color: theme.accent }}>
                {toastMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={{
                background: theme.fg,
                color: theme.bg,
                border: "none",
                borderRadius: 9,
              }}
            >
              {loading ? "Entering Pause…" : "Enter Pause →"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px]" style={{ color: theme.mutedMore }}>
        Pause · presence, not performance
      </footer>
    </div>
  );
}
