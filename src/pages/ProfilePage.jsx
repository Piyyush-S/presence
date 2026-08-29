// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Camera,
  Lock,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";
import { VIBES, getVibeInfo } from "../constants/vibes";

export default function ProfilePage({
  onBack,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats,
  onLogout,
}) {
  const { theme } = useTheme();

  /* ---------------- State ---------------- */
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [mood, setMood] = useState("Calm ☁️");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [energy, setEnergy] = useState(60);
  const [discoverable, setDiscoverable] = useState(true);
  const [availabilityMode, setAvailabilityMode] = useState("open"); // "open" | "quiet"
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* ---------------- Load User Data ---------------- */
  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser?.email) return;
      try {
        const refDoc = doc(db, "users", currentUser.email);
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          const d = snap.data();
          setUserData(d);
          setName(d.name || "");
          setUsername(d.username || currentUser.username || "");
          setMood(d.mood || "Calm ☁️");
          setCity(d.city || "");
          setAge(d.age || "");
          setGender(d.gender || "");
          setBio(d.bio || "");
          setEnergy(Number.isFinite(Number(d.energy)) ? Number(d.energy) : 60);
          setDiscoverable(d.discoverable ?? true);
          setAvailabilityMode(d.availabilityMode || "open");
        } else {
          setUserData({ email: currentUser.email });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    setSaving(true);
    setToastMsg("Saving profile…");

    try {
      let finalImg = userData?.img || "";

      if (profilePicFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePics/${currentUser.email}`);
        await uploadBytes(storageRef, profilePicFile);
        finalImg = await getDownloadURL(storageRef);
      }

      const updated = {
        name: name.trim(),
        mood,
        city: city.trim(),
        age: age ? Number(age) : "",
        gender: gender || "",
        bio: bio.trim(),
        energy: Number(energy),
        discoverable,
        availabilityMode,
        img: finalImg,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "users", currentUser.email), updated);

      const merged = { ...currentUser, ...(userData || {}), ...updated };
      setUserData(merged);
      localStorage.setItem("presenceUser", JSON.stringify(merged));

      setToastMsg("Profile saved successfully.");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      setToastMsg("Failed to update profile.");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: theme.card,
    border: `1px solid ${theme.border}`,
    color: theme.fg,
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    outline: "none",
    transition: "border-color .2s, background .2s",
  };

  const currentVibeInfo = getVibeInfo(mood);

  return (
    <AppShell
      active="profile"
      onNavigate={(t) => {
        if (t === "home") onBack?.();
        if (t === "friends") onOpenFriends?.();
        if (t === "chats") onOpenChats?.();
        if (t === "notifications") onOpenNotifications?.();
      }}
      onLogout={onLogout}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-36 md:pb-12 w-full">
        {/* Header */}
        <header className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-normal tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
          >
            Your Profile
          </h1>
          <p className="text-xs mt-1" style={{ color: theme.muted }}>
            Manage how you appear to others when present.
          </p>
        </header>

        {/* ================= SECTION 1: PRESENCE PROFILE ================= */}
        <section
          className="p-6 rounded-2xl border mb-6 transition-all duration-300"
          style={{ background: theme.card, borderColor: theme.border }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              <Avatar
                src={previewPic || userData?.img}
                name={name || username}
                email={currentUser?.email}
                size={74}
                status="online"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 p-2 rounded-full cursor-pointer transition-transform hover:scale-105 shadow-md flex items-center justify-center text-white"
                style={{ background: theme.accent }}
                title="Change photo"
              >
                <Camera size={13} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <div>
                  <h2 className="text-lg font-semibold truncate" style={{ color: theme.fg }}>
                    {name || username || "Friend"}
                  </h2>
                  <p className="text-xs truncate" style={{ color: theme.muted }}>
                    @{username || currentUser?.email?.split("@")[0]}
                  </p>
                </div>

                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium self-center sm:self-auto"
                  style={{
                    background: theme.accentMuted,
                    border: `1px solid ${theme.accentBorder}`,
                    color: theme.accent,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Present now</span>
                </div>
              </div>

              {/* Vibe badge */}
              <div
                className="p-3 rounded-xl mt-3 flex items-center justify-between gap-3"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{currentVibeInfo.emoji}</span>
                  <div className="min-w-0 text-left">
                    <span className="text-xs font-semibold block truncate" style={{ color: theme.fg }}>
                      {currentVibeInfo.label}
                    </span>
                    <span className="text-[11px] block truncate" style={{ color: theme.muted }}>
                      {currentVibeInfo.description}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70" style={{ color: theme.accent }}>
                  Active Vibe
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: IDENTITY & DETAILS FORM ================= */}
        <form onSubmit={handleSave} className="space-y-6">
          <section
            className="p-6 rounded-2xl border transition-all duration-300 space-y-4"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: theme.muted }}>
              Identity & Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your preferred name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Username (Locked) */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username ? `@${username}` : ""}
                    disabled
                    style={{
                      ...inputStyle,
                      background: theme.surface,
                      color: theme.muted,
                      cursor: "not-allowed",
                      paddingRight: 36,
                    }}
                  />
                  <Lock
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: theme.muted }}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, Tokyo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  placeholder="e.g. 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Gender */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={inputStyle}
                >
                  <option value="" style={{ background: theme.bg, color: theme.fg }}>
                    Prefer not to say
                  </option>
                  <option value="male" style={{ background: theme.bg, color: theme.fg }}>
                    Male
                  </option>
                  <option value="female" style={{ background: theme.bg, color: theme.fg }}>
                    Female
                  </option>
                  <option value="non-binary" style={{ background: theme.bg, color: theme.fg }}>
                    Non-binary
                  </option>
                  <option value="other" style={{ background: theme.bg, color: theme.fg }}>
                    Other
                  </option>
                </select>
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: theme.fg }}>
                  Short Note / Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="A quiet thought or what brings you presence today…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* Energy Level Slider */}
              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: theme.fg }}>
                    Social Energy Level
                  </label>
                  <span className="text-xs font-bold" style={{ color: theme.accent }}>
                    {energy}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="w-full accent-[#7B9EFF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: theme.muted }}>
                  <span>Low (Quiet contemplation)</span>
                  <span>Medium</span>
                  <span>High (Ready to talk)</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: PRESENCE PREFERENCES ================= */}
          <section
            className="p-6 rounded-2xl border transition-all duration-300 space-y-4"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: theme.muted }}>
              Presence Preferences
            </h3>

            {/* Default Vibe Picker */}
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: theme.fg }}>
                Default Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {VIBES.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setMood(v.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    style={{
                      background: mood === v.name ? theme.fg : theme.surface,
                      color: mood === v.name ? theme.bg : theme.muted,
                      border: `1px solid ${mood === v.name ? theme.fg : theme.border}`,
                    }}
                  >
                    <span>{v.emoji}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discoverability Switch */}
            <div
              className="p-4 rounded-xl flex items-center justify-between gap-4"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <div>
                <h4 className="text-xs font-semibold" style={{ color: theme.fg }}>
                  Show in Presence Feed
                </h4>
                <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>
                  Allow people to see your presence and send connection requests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDiscoverable((d) => !d)}
                className="p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                style={{
                  background: discoverable ? theme.accentMuted : theme.card,
                  border: `1px solid ${discoverable ? theme.accentBorder : theme.border}`,
                  color: discoverable ? theme.accent : theme.muted,
                }}
              >
                {discoverable ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{discoverable ? "Visible" : "Invisible"}</span>
              </button>
            </div>
          </section>

          {/* ================= SAVE ACTIONS & TOAST ================= */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs font-medium" style={{ color: theme.accent }}>
              {toastMsg}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
              style={{ background: theme.accent }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* ================= SIGN OUT ================= */}
        {onLogout && (
          <div className="mt-8 pt-6 border-t flex justify-end" style={{ borderColor: theme.border }}>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.danger,
              }}
            >
              <LogOut size={14} />
              <span>Sign Out of Pause</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
