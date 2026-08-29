// src/pages/HomeDashboard.jsx
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  X,
  Clock,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AppShell from "../components/AppShell";
import UserCard from "../components/UserCard";
import FilterBar from "../components/FilterBar";
import Avatar from "../components/Avatar";
import { VIBES, getVibeInfo } from "../constants/vibes";

export default function HomeDashboard({
  onLogout,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats,
}) {
  const { dark, theme } = useTheme();

  /* ---------------- State ---------------- */
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeGroup, setActiveGroup] = useState("all"); // "all" | "open" | "same_vibe" | "nearby"

  // Filter criteria
  const [filters, setFilters] = useState({
    gender: "",
    city: "",
    age: "",
    vibe: "",
    availability: "",
  });

  // User & presence state
  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const [userName, setUserName] = useState(currentUser?.name || currentUser?.username || "Friend");
  const [userMood, setUserMood] = useState(currentUser?.mood || "Calm ☁️");
  const [userCity, setUserCity] = useState(currentUser?.city || "");

  // Relations state
  const [friendEmails, setFriendEmails] = useState(new Set());
  const [outgoingPending, setOutgoingPending] = useState(new Set());
  const [incomingPending, setIncomingPending] = useState(new Set());
  const [blockedEmails, setBlockedEmails] = useState(new Set());
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Session duration timer
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Selected profile detail modal
  const [selectedProfile, setSelectedProfile] = useState(null);

  /* ---------------- Session Timer ---------------- */
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setSessionMinutes(Math.max(1, Math.floor((Date.now() - start) / 60000)));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- Load User Profile ---------------- */
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!currentUser?.email) return;
      try {
        const ref = doc(db, "users", currentUser.email);
        const snap = await getDoc(ref);
        if (!snap.exists() || ignore) return;
        const d = snap.data();
        setUserName(d.name?.split(" ")[0] || d.username || "Friend");
        if (d.mood) setUserMood(d.mood);
        if (d.city) setUserCity(d.city);
        localStorage.setItem("presenceUser", JSON.stringify({ ...currentUser, ...d }));
      } catch (e) {
        console.warn("Could not fetch user profile:", e);
      }
    }
    run();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);

  /* ---------------- Presence Heartbeat ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const ref = doc(db, "users", currentUser.email);

    const touch = async () => {
      try {
        await updateDoc(ref, {
          active: true,
          lastActive: serverTimestamp(),
        });
      } catch (_) {}
    };

    touch();
    const interval = setInterval(touch, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.email]);

  /* ---------------- Realtime People Listener ---------------- */
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.email && u.email !== currentUser?.email);

        // Sort: Active users first, then by last active
        list.sort((a, b) => {
          if (a.active && !b.active) return -1;
          if (!a.active && b.active) return 1;
          return (b.lastActive?.seconds || 0) - (a.lastActive?.seconds || 0);
        });

        setPeople(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore presence error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Realtime Friends Listener ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(collection(db, "friends"), (snap) => {
      const set = new Set();
      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.userA === currentUser.email) set.add(d.userB);
        if (d.userB === currentUser.email) set.add(d.userA);
      });
      setFriendEmails(set);
    });
    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Realtime Friend Requests Listener ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(collection(db, "friendRequests"), (snap) => {
      const outSet = new Set();
      const inSet = new Set();
      let unread = 0;

      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.from === currentUser.email && d.status === "pending") {
          outSet.add(d.to);
        }
        if (d.to === currentUser.email && d.status === "pending") {
          inSet.add(d.from);
          unread += 1;
        }
      });

      setOutgoingPending(outSet);
      setIncomingPending(inSet);
      setUnreadAlerts(unread);
    });

    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Realtime Blocked Listener ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(doc(db, "blocked", currentUser.email), (snap) => {
      if (snap.exists()) {
        setBlockedEmails(new Set(snap.data().emails || []));
      } else {
        setBlockedEmails(new Set());
      }
    });
    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Actions ---------------- */
  const handleVibeSelect = async (vibeName) => {
    setUserMood(vibeName);
    const updated = { ...currentUser, mood: vibeName };
    localStorage.setItem("presenceUser", JSON.stringify(updated));

    if (currentUser?.email) {
      try {
        await updateDoc(doc(db, "users", currentUser.email), {
          mood: vibeName,
          lastActive: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to update mood:", err);
      }
    }
  };

  const handleSendRequest = async (toEmail) => {
    if (!currentUser?.email || !toEmail) return;
    try {
      await addDoc(collection(db, "friendRequests"), {
        from: currentUser.email,
        to: toEmail,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  const handleOpenChat = (peerEmail) => {
    localStorage.setItem("chatWith", peerEmail);
    onOpenChats?.();
  };

  const handleTouchPresence = async () => {
    if (!currentUser?.email) return;
    try {
      await updateDoc(doc(db, "users", currentUser.email), {
        active: true,
        lastActive: serverTimestamp(),
      });
    } catch (_) {}
  };

  /* ---------------- Filtering Logic ---------------- */
  const allCities = useMemo(() => {
    const set = new Set();
    people.forEach((p) => {
      if (p.city) set.add(p.city);
    });
    return Array.from(set).sort();
  }, [people]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.city) count++;
    if (filters.age) count++;
    if (filters.vibe) count++;
    if (filters.availability) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      gender: "",
      city: "",
      age: "",
      vibe: "",
      availability: "",
    });
    setSearch("");
    setActiveGroup("all");
  };

  const filteredPeople = useMemo(() => {
    return people.filter((u) => {
      if (u.discoverable === false) return false;
      if (blockedEmails.has(u.email)) return false;

      // Group tabs
      if (activeGroup === "open") {
        if (!u.mood?.includes("Open to Talk") && !u.vibe?.includes("Open to Talk")) {
          return false;
        }
      } else if (activeGroup === "same_vibe") {
        if (u.mood !== userMood && u.vibe !== userMood) return false;
      } else if (activeGroup === "nearby") {
        if (!userCity || u.city?.toLowerCase() !== userCity.toLowerCase()) {
          return false;
        }
      }

      // Keyword search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesUsername = u.username?.toLowerCase().includes(q);
        const matchesCity = u.city?.toLowerCase().includes(q);
        const matchesBio = u.bio?.toLowerCase().includes(q);
        const matchesMood = u.mood?.toLowerCase().includes(q);
        if (!matchesName && !matchesUsername && !matchesCity && !matchesBio && !matchesMood) {
          return false;
        }
      }

      // Dropdown filters
      if (filters.gender && u.gender?.toLowerCase() !== filters.gender.toLowerCase()) {
        return false;
      }
      if (filters.city && u.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
      if (filters.vibe && u.mood !== filters.vibe && u.vibe !== filters.vibe) {
        return false;
      }
      if (filters.availability === "online" && !u.active) {
        return false;
      }
      if (filters.availability === "offline" && u.active) {
        return false;
      }
      if (filters.age) {
        const [min, max] = filters.age.split("-").map(Number);
        const userAge = Number(u.age);
        if (!userAge || userAge < min || userAge > max) return false;
      }

      return true;
    });
  }, [people, search, filters, activeGroup, userMood, userCity, blockedEmails]);

  // Vibe info object
  const currentVibeInfo = getVibeInfo(userMood);

  // Present people count
  const onlineCount = useMemo(() => people.filter((p) => p.active).length, [people]);
  const openToTalkCount = useMemo(
    () => people.filter((p) => p.mood?.includes("Open to Talk")).length,
    [people]
  );

  return (
    <AppShell
      active="home"
      notificationCount={unreadAlerts}
      onNavigate={(tab) => {
        if (tab === "friends") onOpenFriends?.();
        if (tab === "chats") onOpenChats?.();
        if (tab === "notifications") onOpenNotifications?.();
        if (tab === "profile") onOpenProfile?.();
      }}
      onLogout={onLogout}
      ambientVariant="presence"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 w-full">
        {/* ================= HERO HEADER ================= */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
            <h1
              className="text-2xl sm:text-3xl font-normal tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
            >
              Presence Space
            </h1>
            <p className="text-xs font-medium" style={{ color: theme.muted }}>
              Welcome back, {userName}.
            </p>
          </div>
          <p className="text-xs leading-relaxed max-w-xl" style={{ color: theme.muted }}>
            A calm space for quiet connection. You are visible only when you choose to be present.
          </p>
        </header>

        {/* ================= INTERACTIVE VIBE SELECTOR ================= */}
        <section
          className="p-5 rounded-2xl border mb-8 transition-all duration-300"
          style={{
            background: theme.card,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
                Current Vibe:
              </span>
              <span className="text-xs font-bold" style={{ color: theme.fg }}>
                {currentVibeInfo.name}
              </span>
            </div>
            <span className="text-[11px] italic hidden sm:inline" style={{ color: theme.muted }}>
              "{currentVibeInfo.description}"
            </span>
          </div>

          {/* Vibe Pills */}
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => {
              const isSelected = userMood === v.name || userMood.startsWith(v.label);
              return (
                <button
                  key={v.name}
                  onClick={() => handleVibeSelect(v.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                  style={{
                    background: isSelected ? theme.fg : theme.surface,
                    color: isSelected ? theme.bg : theme.muted,
                    border: `1px solid ${isSelected ? theme.fg : theme.border}`,
                  }}
                  title={v.description}
                >
                  <span>{v.emoji}</span>
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= 2-COLUMN MAIN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT/MAIN COLUMN (8 cols on desktop) */}
          <main className="lg:col-span-8 space-y-6">
            {/* Quick Discover Tabs & Search */}
            <div className="space-y-3">
              {/* Grouping Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: "all", label: "All Present", count: people.length },
                  { id: "open", label: "Open to Talk", count: openToTalkCount },
                  { id: "same_vibe", label: "Same Vibe", count: people.filter((p) => p.mood === userMood).length },
                  { id: "nearby", label: userCity ? `In ${userCity}` : "Around You", count: people.filter((p) => p.city === userCity).length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGroup(tab.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                    style={{
                      background: activeGroup === tab.id ? theme.fg : theme.card,
                      color: activeGroup === tab.id ? theme.bg : theme.muted,
                      border: `1px solid ${activeGroup === tab.id ? theme.fg : theme.border}`,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                      style={{
                        background: activeGroup === tab.id ? theme.bg : theme.surface,
                        color: activeGroup === tab.id ? theme.fg : theme.muted,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Filter Trigger Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: theme.muted }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, @username, city, or bio…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs outline-none transition-colors"
                    style={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      color: theme.fg,
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters((s) => !s)}
                  className="px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
                  style={{
                    background: showFilters || activeFilterCount > 0 ? theme.accentMuted : theme.card,
                    border: `1px solid ${showFilters || activeFilterCount > 0 ? theme.accentBorder : theme.border}`,
                    color: showFilters || activeFilterCount > 0 ? theme.accent : theme.fg,
                  }}
                >
                  <SlidersHorizontal size={14} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span
                      className="px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white"
                      style={{ background: theme.accent }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Bar Panel */}
              <FilterBar
                filters={filters}
                setFilters={setFilters}
                options={{ cities: allCities }}
                isOpen={showFilters}
                onToggle={() => setShowFilters((s) => !s)}
                activeFilterCount={activeFilterCount}
                onReset={clearFilters}
              />
            </div>

            {/* ================= PERSON GRID / EMPTY STATE ================= */}
            {loading ? (
              <div className="py-24 text-center text-xs" style={{ color: theme.muted }}>
                Tuning into the presence space…
              </div>
            ) : filteredPeople.length === 0 ? (
              /* Actionable Empty State */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-14 sm:py-18 px-6 text-center rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                  background: theme.card,
                  borderColor: theme.border,
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full animate-pulse opacity-40"
                    style={{ background: theme.accentMuted, filter: "blur(8px)" }}
                  />
                  <div className="animate-float relative z-10" style={{ color: theme.accent }}>
                    <Sparkles size={24} strokeWidth={1.75} />
                  </div>
                </div>

                <h3
                  className="text-lg font-normal tracking-tight mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
                >
                  {search || activeFilterCount > 0 ? "No one matches your filters" : "It's quiet here."}
                </h3>

                <p className="text-xs leading-relaxed max-w-md mb-6" style={{ color: theme.muted }}>
                  {search || activeFilterCount > 0
                    ? "Try broadening your search keywords or resetting your active criteria."
                    : "Pause is a space where conversations end naturally and presence is a choice. You can share your presence or discover people to connect with."}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {search || activeFilterCount > 0 ? (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                      style={{ background: theme.fg, color: theme.bg }}
                    >
                      Clear all filters
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleTouchPresence}
                        className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm"
                        style={{ background: theme.accent }}
                      >
                        I'm Here
                      </button>
                      <button
                        onClick={onOpenFriends}
                        className="px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        style={{
                          background: theme.surface,
                          border: `1px solid ${theme.border}`,
                          color: theme.fg,
                        }}
                      >
                        Discover People
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Populated Presence Grid */
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.04 },
                  },
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {filteredPeople.map((u) => {
                  const isFriend = friendEmails.has(u.email);
                  const isRequested = outgoingPending.has(u.email);
                  const isIncoming = incomingPending.has(u.email);

                  return (
                    <UserCard
                      key={u.email}
                      user={u}
                      isFriend={isFriend}
                      isRequested={isRequested}
                      isIncoming={isIncoming}
                      onView={(usr) => setSelectedProfile(usr)}
                      onRequest={(email) => handleSendRequest(email)}
                      onChat={(email) => handleOpenChat(email)}
                    />
                  );
                })}
              </motion.div>
            )}
          </main>

          {/* ================= RIGHT CONTEXT PANEL (Desktop ≥1024px) ================= */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col space-y-5 sticky top-6">
            {/* "Your Presence" Detail Card */}
            <div
              className="p-5 rounded-2xl border transition-all duration-300"
              style={{
                background: theme.card,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
                  Your Presence
                </span>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: theme.accentMuted,
                    border: `1px solid ${theme.accentBorder}`,
                    color: theme.accent,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active now
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <Avatar
                  src={currentUser?.img}
                  name={userName}
                  email={currentUser?.email}
                  size={52}
                  status="online"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                    {userName}
                  </h3>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: theme.muted }}>
                    @{currentUser?.username || currentUser?.email?.split("@")[0]}
                  </p>
                  {userCity && (
                    <div className="flex items-center gap-1 text-[10px] mt-1" style={{ color: theme.mutedMore }}>
                      <MapPin size={10} />
                      <span className="truncate">{userCity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vibe preview */}
              <div
                className="p-3 rounded-xl mb-4"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: theme.fg }}>
                    {currentVibeInfo.name}
                  </span>
                  <span className="text-[10px]" style={{ color: theme.muted }}>
                    Current vibe
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: theme.muted }}>
                  {currentVibeInfo.description}
                </p>
              </div>

              {/* Session timer & action */}
              <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-1.5" style={{ color: theme.muted }}>
                  <Clock size={13} />
                  <span>Present for {sessionMinutes}m</span>
                </div>

                <button
                  onClick={onOpenProfile}
                  className="text-xs font-medium hover:underline cursor-pointer"
                  style={{ color: theme.accent }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* "Space Atmosphere" Quick Stats Card */}
            <div
              className="p-5 rounded-2xl border transition-all duration-300"
              style={{
                background: theme.card,
                borderColor: theme.border,
              }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-3" style={{ color: theme.muted }}>
                Space Atmosphere
              </span>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div
                  className="p-3 rounded-xl text-center"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <span className="text-lg font-bold block" style={{ color: theme.fg }}>
                    {onlineCount + 1}
                  </span>
                  <span className="text-[10px]" style={{ color: theme.muted }}>
                    Present now
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl text-center"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <span className="text-lg font-bold block" style={{ color: theme.fg }}>
                    {openToTalkCount}
                  </span>
                  <span className="text-[10px]" style={{ color: theme.muted }}>
                    Open to talk
                  </span>
                </div>
              </div>

              {/* Quiet note */}
              <p className="text-[11px] leading-relaxed italic" style={{ color: theme.mutedMore }}>
                "No public streaks, no unread badge pressure, no performance. Just quiet presence when you want it."
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ================= PROFILE DETAILS MODAL ================= */}
      <AnimatePresence>
        {selectedProfile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              className="w-full max-w-sm p-6 rounded-2xl relative space-y-4"
              style={{
                background: dark ? "#0d0d0d" : "#ffffff",
                border: `1px solid ${theme.border}`,
                boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
              }}
            >
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
                style={{ color: theme.muted }}
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center">
                <Avatar
                  src={selectedProfile.img}
                  name={selectedProfile.name}
                  email={selectedProfile.email}
                  size={64}
                  aura={selectedProfile.aura}
                  status={selectedProfile.active ? "online" : "offline"}
                />

                <h3 className="text-base font-semibold mt-3" style={{ color: theme.fg }}>
                  {selectedProfile.name || "Friend"}
                </h3>
                {selectedProfile.username && (
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                    @{selectedProfile.username}
                  </p>
                )}

                {/* Vibe badge */}
                <div
                  className="my-3 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.accent,
                  }}
                >
                  {selectedProfile.mood || "Calm ☁️"}
                </div>

                {selectedProfile.bio && (
                  <p className="text-xs leading-relaxed px-2 mb-2" style={{ color: theme.muted }}>
                    "{selectedProfile.bio}"
                  </p>
                )}

                {selectedProfile.city && (
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: theme.mutedMore }}>
                    {selectedProfile.city}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.muted,
                  }}
                >
                  Close
                </button>

                {friendEmails.has(selectedProfile.email) ? (
                  <button
                    onClick={() => {
                      setSelectedProfile(null);
                      handleOpenChat(selectedProfile.email);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-white cursor-pointer"
                    style={{ background: theme.accent }}
                  >
                    Chat
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleSendRequest(selectedProfile.email);
                      setSelectedProfile(null);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-white cursor-pointer"
                    style={{ background: theme.accent }}
                  >
                    Connect
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
