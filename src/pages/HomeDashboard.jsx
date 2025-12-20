// src/pages/HomeDashboard.jsx
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";

/* ========================= Small UI helpers ========================= */

const Card = ({ children, className = "" }) => (
  <div className={"bg-white/90 backdrop-blur rounded-3xl shadow-sm hover:shadow-lg transition-shadow " + className}>
    {children}
  </div>
);

const MoodChip = ({ text }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700">
    {text}
  </span>
);

/* ========================= Presence helper (friend-aware) ========================= */
function getPresenceStatus(user, isFriend = false) {
  if (user?.active) {
    return { label: isFriend ? "Online now" : "Active now", colorClass: "bg-green-500" };
  }
  if (!user?.lastActive) return { label: "Offline", colorClass: "bg-gray-400" };

  const last = user.lastActive?.toDate?.() || new Date(user.lastActive);
  const diffMin = (Date.now() - last.getTime()) / 60000;

  if (isFriend) {
    if (diffMin < 1) return { label: "a few seconds ago", colorClass: "bg-yellow-400" };
    if (diffMin < 60) return { label: `${Math.floor(diffMin)} min ago`, colorClass: "bg-yellow-400" };
    const h = Math.floor(diffMin / 60);
    if (h < 24) return { label: `${h}h ago`, colorClass: "bg-gray-400" };
    const d = Math.floor(h / 24);
    return { label: `${d}d ago`, colorClass: "bg-gray-400" };
  }

  if (diffMin < 10) return { label: "Recently active", colorClass: "bg-yellow-400" };
  return { label: "Offline", colorClass: "bg-gray-400" };
}

/* ========================= City dropdown ========================= */
function CitySearchDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");

  useEffect(() => setQ(value || ""), [value]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return options.slice(0, 8);
    return options.filter((c) => c.toLowerCase().includes(term)).slice(0, 12);
  }, [q, options]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search city…"
        className="pl-8 pr-3 py-2 rounded-xl bg-white shadow text-gray-700 text-sm w-48 focus:ring-2 focus:ring-indigo-400 outline-none"
      />
      {open && (
        <ul className="absolute z-50 mt-2 w-full max-h-44 overflow-auto bg-[#fff8c4] border border-yellow-200 rounded-xl shadow-md">
          {filtered.length ? (
            filtered.map((c) => (
              <li
                key={c}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
                onMouseDown={() => {
                  onChange(c);
                  setQ(c);
                  setOpen(false);
                }}
              >
                {c}
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-gray-400">No results</li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ========================= Compact mood select ========================= */
function QuickMoodSelect({ value, options, onChange, saving }) {
  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        {options.map((m) => (
          <option key={m.label} value={m.label}>
            {m.label}
          </option>
        ))}
      </select>
      {saving ? <span className="text-xs text-gray-400">saving…</span> : null}
    </div>
  );
}

/* ========================= Main screen ========================= */
export default function HomeDashboard({
  onLogout,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats, // used for nav + open person chat
}) {
  const [userName, setUserName] = useState("Friend");
  const [userMood, setUserMood] = useState("");
  const [people, setPeople] = useState([]);
  const [friendEmails, setFriendEmails] = useState(() => new Set());
  const [blockedMine, setBlockedMine] = useState(() => new Set()); // who I blocked
  const [search, setSearch] = useState("");

  // filters
  const [selectedMood, setSelectedMood] = useState(null);
  const [filterGender, setFilterGender] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterAge, setFilterAge] = useState("");

  // profile modal
  const [selectedProfile, setSelectedProfile] = useState(null);

  // mood saving
  const [moodSaving, setMoodSaving] = useState(false);

  // heartbeat status text (soft)
  const [presenceSyncing, setPresenceSyncing] = useState(false);
  const presenceTimerRef = useRef(null);

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* ---------------- My profile (name/mood) ---------------- */
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!currentUser?.email) return;
      const ref = doc(db, "users", currentUser.email);
      const snap = await getDoc(ref);
      if (!snap.exists() || ignore) return;
      const d = snap.data();
      setUserName(d.name?.split(" ")[0] || "Friend");
      setUserMood(d.mood || "");
      // refresh cache
      localStorage.setItem("presenceUser", JSON.stringify(d));
    }
    run();
    return () => {
      ignore = true;
    };
  }, [currentUser?.email]);

  /* ---------------- Presence heartbeat (UI-side) ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const ref = doc(db, "users", currentUser.email);

    const touch = async () => {
      try {
        setPresenceSyncing(true);
        await updateDoc(ref, { active: true, lastActive: serverTimestamp() });
      } catch (e) {
        // ignore
      } finally {
        setPresenceSyncing(false);
      }
    };

    touch();
    presenceTimerRef.current = setInterval(touch, 30_000);
    return () => {
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
    };
  }, [currentUser?.email]);

  /* ---------------- Live users feed (sorted) ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const qUsers = query(collection(db, "users"), orderBy("lastActive", "desc"));
    const unsub = onSnapshot(qUsers, (snap) => {
      const list = snap.docs
        .map((d) => d.data())
        .filter((u) => u.email && u.email !== currentUser.email);
      setPeople(list);
    });
    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- My friends (emails -> Set) ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(collection(db, "friends"), (snap) => {
      const mine = new Set();
      snap.docs.forEach((d) => {
        const f = d.data();
        if (f.userA === currentUser.email) mine.add(f.userB);
        if (f.userB === currentUser.email) mine.add(f.userA);
      });
      setFriendEmails(mine);
    });
    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- My blocked subcollection ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(collection(db, "users", currentUser.email, "blocked"), (snap) => {
      const set = new Set(snap.docs.map((d) => d.id));
      setBlockedMine(set);
    });
    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Mood options ---------------- */
  const moods = useMemo(
    () => [
      { label: "Calm ☁️", color: "from-blue-100 to-indigo-100" },
      { label: "Curious 🔍", color: "from-green-100 to-emerald-100" },
      { label: "Energetic ⚡", color: "from-yellow-100 to-orange-100" },
      { label: "Lonely 💭", color: "from-purple-100 to-pink-100" },
      { label: "Open to Talk 💬", color: "from-indigo-100 to-sky-100" },
      { label: "Grateful 🌻", color: "from-amber-100 to-lime-100" },
      { label: "Overwhelmed 🌊", color: "from-teal-100 to-cyan-100" },
      { label: "Lost 💫", color: "from-slate-100 to-gray-100" },
    ],
    []
  );

  /* ---------------- City suggestions ---------------- */
  const defaultCities = useMemo(
    () => ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"],
    []
  );
  const allCities = useMemo(() => {
    const dbCities = people.map((p) => (p.city || "").toString().trim()).filter(Boolean);
    return Array.from(new Set([...defaultCities, ...dbCities])).sort((a, b) => a.localeCompare(b));
  }, [people, defaultCities]);

  /* ---------------- Filtering + search ---------------- */
  const filteredPeople = useMemo(() => {
    const norm = (v) => (v || "").toString().toLowerCase().trim();
    let arr = people.filter((u) => !blockedMine.has(u.email)); // hide blocked

    if (selectedMood) {
      const key = selectedMood.split(" ")[0];
      arr = arr.filter((p) => norm(p.mood).includes(norm(key)));
    }
    if (filterGender) arr = arr.filter((p) => norm(p.gender) === norm(filterGender));
    if (filterCity) arr = arr.filter((p) => norm(p.city).includes(norm(filterCity)));
    if (filterAge) {
      const [min, max] = filterAge.split("-").map(Number);
      arr = arr.filter((p) => {
        const a = Number(p.age);
        return !Number.isNaN(a) && a >= min && a <= max;
      });
    }
    if (search.trim()) {
      const term = norm(search);
      arr = arr.filter(
        (p) =>
          norm(p.name).includes(term) ||
          norm(p.username).includes(term) ||
          norm(p.city).includes(term) ||
          norm(p.mood).includes(term)
      );
    }
    return arr;
  }, [people, blockedMine, selectedMood, filterGender, filterCity, filterAge, search]);

  /* ---------------- Actions ---------------- */

  // Friend request
  const sendFriendRequest = useCallback(
    async (toEmail) => {
      if (!currentUser?.email || !toEmail || toEmail === currentUser.email) return;
      try {
        await addDoc(collection(db, "friendRequests"), {
          from: currentUser.email,
          to: toEmail,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert("Friend request sent!");
      } catch (e) {
        console.error("Friend request failed:", e);
        alert("Unable to send request right now.");
      }
    },
    [currentUser?.email]
  );

  // Update my mood
  const updateUserMood = useCallback(
    async (newMood) => {
      if (!currentUser?.email) return;
      try {
        setMoodSaving(true);
        const refMe = doc(db, "users", currentUser.email);
        await updateDoc(refMe, { mood: newMood, updatedAt: serverTimestamp() });
        setUserMood(newMood);
        // cache refresh
        const cached = rawUser ? JSON.parse(rawUser) : {};
        localStorage.setItem("presenceUser", JSON.stringify({ ...cached, mood: newMood }));
      } catch (e) {
        console.error("Failed to update mood:", e);
        alert("Could not update mood right now.");
      } finally {
        setMoodSaving(false);
      }
    },
    [currentUser?.email, rawUser]
  );

  // Open chat with email (only via Chats tab)
  const openChatWith = useCallback(
    (email) => {
      if (!email) return;
      localStorage.setItem("chatWith", email);
      if (typeof onOpenChats === "function") onOpenChats();
    },
    [onOpenChats]
  );

  /* ========================= UI ========================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-2xl font-bold text-indigo-700 tracking-tight"
        >
          Presence Grid
        </motion.h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:shadow-md"
            title="Notifications"
          >
            🔔
          </button>
          <button
            onClick={onOpenFriends}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:shadow-md"
            title="Friends"
          >
            👥
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onLogout}
            className="bg-white text-indigo-600 px-4 py-2 rounded-full shadow-md hover:shadow-lg font-medium transition"
          >
            Log Out
          </motion.button>
        </div>
      </header>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="px-6 mt-1"
      >
        <h2 className="text-lg text-gray-700">
          Hey, <span className="font-semibold text-indigo-600">{userName}</span> 👋
        </h2>

        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <span className="text-gray-500 text-sm">Your vibe today:</span>
          {userMood ? <MoodChip text={userMood} /> : <MoodChip text="Not set" />}
          <QuickMoodSelect
            value={userMood || moods[0].label}
            options={moods}
            onChange={updateUserMood}
            saving={moodSaving}
          />
          {presenceSyncing && (
            <span className="text-xs text-gray-400">syncing presence…</span>
          )}
        </div>
      </motion.div>

      {/* Mood selector cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="overflow-x-auto px-8 py-5 no-scrollbar"
      >
        <div className="flex gap-6 pb-1">
          {moods.map((m) => (
            <motion.button
              key={m.label}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMood((prev) => (prev === m.label ? null : m.label))}
              className={`flex-shrink-0 w-44 h-32 rounded-3xl bg-gradient-to-br ${m.color} shadow-sm flex items-center justify-center text-gray-700 font-medium transition-all ${
                selectedMood === m.label
                  ? "ring-4 ring-indigo-400 ring-offset-4 shadow-lg"
                  : "hover:shadow-md"
              }`}
            >
              {m.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Search + Filters */}
      <div className="px-6 mb-3 flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, city, mood..."
          className="px-3 py-2 rounded-xl bg-white shadow text-gray-700 text-sm min-w-[240px] flex-1 focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white shadow text-gray-700 text-sm min-w-[130px]"
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <CitySearchDropdown value={filterCity} onChange={setFilterCity} options={allCities} />

        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white shadow text-gray-700 text-sm min-w-[130px]"
        >
          <option value="">Age</option>
          <option value="18-25">18–25</option>
          <option value="26-35">26–35</option>
          <option value="36-50">36–50</option>
          <option value="51-70">51–70</option>
        </select>
      </div>

      {/* People grid */}
      <main className="px-6 pb-28">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">People Around You 🌐</h3>

        {filteredPeople.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">No users match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPeople
  .filter((u) => u.discoverable !== false) // hide non-discoverable users
  .map((u) => {
    const isFriend = friendEmails.has(u.email);
    const presence = getPresenceStatus(u, isFriend);
    const aura = u.aura || "#a78bfa";
    const energy = Number(u.energy ?? 60);

    return (
      <Card
        key={u.email}
        className="p-6 transition-transform hover:scale-[1.02]"
        style={{
          boxShadow: `0 0 15px ${aura}33`, // subtle glow
        }}
      >
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="rounded-full p-[2px] ring-2"
              style={{ ringColor: aura }}
            >
              <img
                src={u.img || `https://i.pravatar.cc/120?u=${u.email}`}
                alt={u.name || "User"}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <span
              className={`absolute bottom-1 right-1 w-3 h-3 rounded-full ring-2 ring-white ${presence.colorClass}`}
              title={presence.label}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-700 truncate flex items-center gap-1">
              {u.name || "Unknown"}{" "}
              {u.username ? (
                <span className="text-xs text-gray-400 ml-1">@{u.username}</span>
              ) : null}
            </h4>
            {u.bio ? (
              <p className="text-xs text-gray-500 italic truncate">
                “{u.bio}”
              </p>
            ) : null}
            <p className="text-xs text-gray-500 truncate">{u.mood || "—"}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {(u.city || "🌍 Unknown").toString()}
            </p>
            <p className="text-[11px] text-gray-400">
              {isFriend ? `Last seen: ${presence.label}` : presence.label}
            </p>
          </div>
        </div>

        {/* Energy bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${energy}%`,
              background: `linear-gradient(to right, ${aura}, #6366f1)`,
              boxShadow: `0 0 8px ${aura}`,
            }}
          ></div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setSelectedProfile(u)}
            className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            View
          </button>

          {!isFriend ? (
            <button
              onClick={() => sendFriendRequest(u.email)}
              className="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Add Friend
            </button>
          ) : null}

          {isFriend ? (
            <button
              onClick={() => openChatWith(u.email)}
              className="px-3 py-1 rounded-full text-sm bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
            >
              Chat
            </button>
          ) : null}
        </div>
      </Card>
    );
  })}

          </div>
        )}
      </main>

      {/* Profile modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="p-6 w-80 text-center relative">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✖
            </button>

            {(() => {
              const isFriend = friendEmails.has(selectedProfile.email);
              const presence = getPresenceStatus(selectedProfile, isFriend);
              return (
                <>
                  <div className="relative inline-block">
                    <img
                      src={
                        selectedProfile.img ||
                        `https://i.pravatar.cc/120?u=${selectedProfile.email}`
                      }
                      alt=""
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                    />
                    <span
                      className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white ${presence.colorClass}`}
                      title={presence.label}
                    />
                  </div>
                  <p className="text-xs text-gray-400 -mt-1 mb-2">
                    {isFriend ? `Last seen: ${presence.label}` : presence.label}
                  </p>
                </>
              );
            })()}

            <h2 className="text-lg font-semibold text-gray-800">
              {selectedProfile.name}
              {selectedProfile.username ? (
                <span className="text-xs text-gray-400 ml-1">@{selectedProfile.username}</span>
              ) : null}
            </h2>
            <p className="text-sm text-gray-500">{selectedProfile.mood}</p>
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>📍 {selectedProfile.city || "Unknown"}</p>
              <p>🧍 {selectedProfile.gender || "—"}</p>
              <p>🎂 {selectedProfile.age || "—"}</p>
            </div>

<div className="mt-4 flex gap-2 justify-center">
  <button
    onClick={() => setSelectedProfile(null)}
    className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
  >
    Close
  </button>

  {!friendEmails.has(selectedProfile.email) ? (
    <button
      onClick={() => {
        sendFriendRequest(selectedProfile.email);
        setSelectedProfile(null);
      }}
      className="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white hover:bg-indigo-700"
    >
      Add Friend
    </button>
  ) : (
    <button
      onClick={() => {
        openChatWith(selectedProfile.email);
        setSelectedProfile(null);
      }}
      className="px-3 py-1 rounded-full text-sm bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
    >
      Chat
    </button>
  )}
</div>

          </Card>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 pb-3 bg-gradient-to-t from-white/60 via-white/40 to-transparent backdrop-blur-md">
        <BottomNav
          active="home"
          onNavigate={(page) => {
            if (page === "profile") onOpenProfile?.();
            if (page === "chats") onOpenChats?.();
          }}
        />
      </div>
    </div>
  );
}
