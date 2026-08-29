// src/pages/ChatsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  getDocs,
  where,
  query,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  X,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AppShell from "../components/AppShell";
import UserCard from "../components/UserCard";
import Avatar from "../components/Avatar";

export default function ChatsPage({
  onBack,
  onOpenChat,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats,
  onLogout,
}) {
  const { dark, theme } = useTheme();
  const raw = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const me = raw ? JSON.parse(raw) : null;

  /* ---------------- State ---------------- */
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [peopleOpenToTalk, setPeopleOpenToTalk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active"); // "active" | "recent"

  // Circle Creation Modal
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleAccess, setCircleAccess] = useState("friends"); // "friends" | "anyone" | "invite"
  const [circleDuration, setCircleDuration] = useState("1hr"); // "30min" | "1hr" | "3hr" | "leave"
  const [selectedFriends, setSelectedFriends] = useState({});

  /* ---------------- Realtime Chats ---------------- */
  useEffect(() => {
    if (!me?.email) return;
    setLoading(true);

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", me.email)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setChats(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Chats listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [me?.email]);

  /* ---------------- Realtime Friends ---------------- */
  useEffect(() => {
    if (!me?.email) return;
    const unsub = onSnapshot(collection(db, "friends"), async (snap) => {
      const friendEmails = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.userA === me.email) friendEmails.push(data.userB);
        if (data.userB === me.email) friendEmails.push(data.userA);
      });

      const list = [];
      for (const email of friendEmails) {
        try {
          const userSnap = await getDocs(
            query(collection(db, "users"), where("email", "==", email))
          );
          if (!userSnap.empty) {
            list.push({ id: email, ...userSnap.docs[0].data() });
          } else {
            list.push({ id: email, email, name: email.split("@")[0] });
          }
        } catch (_) {
          list.push({ id: email, email, name: email.split("@")[0] });
        }
      }
      setFriends(list);
    });

    return () => unsub();
  }, [me?.email]);

  /* ---------------- Realtime Users Open to Talk ---------------- */
  useEffect(() => {
    if (!me?.email) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const openUsers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (u) =>
            u.email &&
            u.email !== me.email &&
            u.discoverable !== false &&
            (u.mood?.includes("Open to Talk") || u.active)
        );
      setPeopleOpenToTalk(openUsers);
    });
    return () => unsub();
  }, [me?.email]);

  /* ---------------- Create Circle Action ---------------- */
  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!circleName.trim() || !me?.email) return;

    const chosenMembers = Object.keys(selectedFriends).filter((k) => selectedFriends[k]);
    const participants = Array.from(new Set([me.email, ...chosenMembers]));
    const circleId = `group_${Date.now()}`;

    // Write circle doc to Firestore
    try {
      await setDoc(doc(db, "chats", circleId), {
        type: "group",
        groupName: circleName.trim(),
        participants,
        createdBy: me.email,
        access: circleAccess,
        duration: circleDuration,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: `Circle created with duration ${circleDuration}`,
      });

      setCircleName("");
      setSelectedFriends({});
      setShowCreateCircle(false);

      // Open new circle conversation
      localStorage.setItem("chatWith", circleId);
      onOpenChat?.(circleId);
    } catch (err) {
      console.error("Failed to create circle:", err);
    }
  };

  /* ---------------- Filter Chats ---------------- */
  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      // Tab filter
      const isRecentOnly = !c.activeSession && c.lastMessage;
      if (tab === "active" && isRecentOnly) return false;
      if (tab === "recent" && !isRecentOnly && chats.length > 3) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = c.groupName || c.participants?.find((p) => p !== me.email) || "";
      const lastMsg = c.lastMessage || "";
      return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
    });
  }, [chats, search, tab, me?.email]);

  return (
    <AppShell
      active="chats"
      onNavigate={(t) => {
        if (t === "home") onBack?.();
        if (t === "friends") onOpenFriends?.();
        if (t === "notifications") onOpenNotifications?.();
        if (t === "profile") onOpenProfile?.();
      }}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 w-full">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-normal tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
            >
              Conversations
            </h1>
            <p className="text-xs mt-1" style={{ color: theme.muted }}>
              Timed, quiet conversations that end naturally. No unread pressure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div
              className="p-1 rounded-2xl flex items-center gap-1 border"
              style={{ background: theme.card, borderColor: theme.border }}
            >
              <button
                onClick={() => setTab("active")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: tab === "active" ? theme.fg : "transparent",
                  color: tab === "active" ? theme.bg : theme.muted,
                }}
              >
                Active ({chats.length})
              </button>
              <button
                onClick={() => setTab("recent")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: tab === "recent" ? theme.fg : "transparent",
                  color: tab === "recent" ? theme.bg : theme.muted,
                }}
              >
                Recent
              </button>
            </div>

            {/* New Circle Trigger */}
            <button
              onClick={() => setShowCreateCircle(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white cursor-pointer shadow-sm"
              style={{ background: theme.accent }}
            >
              <Plus size={14} />
              <span>New Circle</span>
            </button>
          </div>
        </header>

        {/* ================= START DM FRIEND ROW ================= */}
        {friends.length > 0 && (
          <section className="mb-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: theme.muted }}>
              Start Conversation
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {friends.map((f) => (
                <button
                  key={f.email}
                  onClick={() => {
                    localStorage.setItem("chatWith", f.email);
                    onOpenChat?.(f.email);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex-shrink-0 group hover:scale-[1.03]"
                  style={{
                    background: theme.card,
                    borderColor: theme.border,
                    width: 80,
                  }}
                >
                  <Avatar
                    src={f.img}
                    name={f.name}
                    email={f.email}
                    size={42}
                    status={f.active ? "online" : "offline"}
                  />
                  <span className="text-[11px] font-medium truncate w-full text-center" style={{ color: theme.fg }}>
                    {f.name?.split(" ")[0] || f.username || f.email.split("@")[0]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: theme.muted }}
          />
          <input
            type="text"
            placeholder="Search conversations by name or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-colors"
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.fg,
              fontFamily: "'Manrope', sans-serif",
            }}
          />
        </div>

        {/* ================= CONVERSATIONS LIST ================= */}
        <section className="space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs" style={{ color: theme.muted }}>
              Loading conversations…
            </div>
          ) : filteredChats.length === 0 ? (
            /* Actionable Empty State */
            <div className="space-y-8">
              <div
                className="p-8 rounded-2xl border text-center flex flex-col items-center justify-center"
                style={{ background: theme.card, borderColor: theme.border }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <MessageSquare size={22} style={{ color: theme.accent }} />
                </div>
                <h3
                  className="text-base font-normal tracking-tight mb-1"
                  style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
                >
                  No conversations yet.
                </h3>
                <p className="text-xs max-w-sm mb-5 leading-relaxed" style={{ color: theme.muted }}>
                  Conversations begin when two people choose to share presence. Pick a friend above or find someone open to talk.
                </p>
                <button
                  onClick={onOpenFriends}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  style={{ background: theme.accent }}
                >
                  Find Someone to Talk To
                </button>
              </div>

              {/* People Open to Talk Section */}
              {peopleOpenToTalk.length > 0 && (
                <div>
                  <h3
                    className="text-lg font-normal tracking-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
                  >
                    People Open to Talk
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {peopleOpenToTalk.slice(0, 6).map((usr) => (
                      <UserCard
                        key={usr.email}
                        user={usr}
                        isFriend={friends.some((f) => f.email === usr.email)}
                        onChat={(em) => {
                          localStorage.setItem("chatWith", em);
                          onOpenChat?.(em);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Populated Conversations Stream */
            <div className="space-y-2.5 max-w-3xl">
              {filteredChats.map((c) => {
                const isGroup = c.type === "group";
                const peerEmail = isGroup
                  ? null
                  : (c.participants || []).find((p) => p !== me.email);
                const title = isGroup
                  ? c.groupName || "Presence Circle"
                  : peerEmail?.split("@")[0] || "Conversation";

                return (
                  <motion.div
                    key={c.id}
                    whileHover={{ x: 2, scale: 1.005 }}
                    onClick={() => {
                      localStorage.setItem("chatWith", isGroup ? c.id : peerEmail);
                      onOpenChat?.(isGroup ? c.id : peerEmail);
                    }}
                    className="p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer"
                    style={{
                      background: theme.card,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {isGroup ? (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: theme.accentMuted,
                            border: `1px solid ${theme.accentBorder}`,
                            color: theme.accent,
                          }}
                        >
                          <Users size={18} />
                        </div>
                      ) : (
                        <Avatar email={peerEmail} size={44} status="offline" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                            {title}
                          </h4>
                          {isGroup && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                              style={{
                                background: theme.surface,
                                color: theme.accent,
                                border: `1px solid ${theme.border}`,
                              }}
                            >
                              Circle
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                          {c.lastMessage || "Quiet presence session"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 text-right">
                      <span className="text-[10px]" style={{ color: theme.mutedMore }}>
                        {c.updatedAt?.seconds
                          ? new Date(c.updatedAt.seconds * 1000).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= CREATE CIRCLE MODAL ================= */}
        <AnimatePresence>
          {showCreateCircle && (
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
                className="w-full max-w-md p-6 sm:p-8 rounded-2xl relative space-y-5"
                style={{
                  background: dark ? "#0d0d0d" : "#ffffff",
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
                }}
              >
                <button
                  onClick={() => setShowCreateCircle(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
                  style={{ color: theme.muted }}
                >
                  <X size={18} />
                </button>

                <div>
                  <h2
                    className="text-xl font-normal tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
                  >
                    Create a Circle
                  </h2>
                  <p className="text-xs mt-1" style={{ color: theme.muted }}>
                    A temporary presence room for friends to gather and connect.
                  </p>
                </div>

                <form onSubmit={handleCreateCircle} className="space-y-4">
                  {/* Circle Name */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
                      Circle Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quiet Morning Tea, Deep Work Lounge"
                      value={circleName}
                      onChange={(e) => setCircleName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-xs outline-none"
                      style={{
                        background: theme.card,
                        border: `1px solid ${theme.border}`,
                        color: theme.fg,
                      }}
                    />
                  </div>

                  {/* Who can join */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
                      Who can join?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "friends", label: "Friends" },
                        { id: "anyone", label: "Anyone" },
                        { id: "invite", label: "Invite only" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCircleAccess(opt.id)}
                          className="py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-center cursor-pointer"
                          style={{
                            background: circleAccess === opt.id ? theme.fg : theme.surface,
                            color: circleAccess === opt.id ? theme.bg : theme.muted,
                            border: `1px solid ${circleAccess === opt.id ? theme.fg : theme.border}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
                      Duration (Ends naturally)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "30min", label: "30 min" },
                        { id: "1hr", label: "1 hour" },
                        { id: "3hr", label: "3 hours" },
                        { id: "leave", label: "Until leave" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCircleDuration(opt.id)}
                          className="py-2 px-2 rounded-xl text-[11px] font-medium transition-all text-center cursor-pointer"
                          style={{
                            background: circleDuration === opt.id ? theme.fg : theme.surface,
                            color: circleDuration === opt.id ? theme.bg : theme.muted,
                            border: `1px solid ${circleDuration === opt.id ? theme.fg : theme.border}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Friends */}
                  {friends.length > 0 && (
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
                        Invite Friends (Optional)
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-xl border" style={{ background: theme.surface, borderColor: theme.border }}>
                        {friends.map((f) => {
                          const checked = Boolean(selectedFriends[f.email]);
                          return (
                            <label
                              key={f.email}
                              className="flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar email={f.email} size={24} />
                                <span style={{ color: theme.fg }}>{f.name || f.email.split("@")[0]}</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedFriends((prev) => ({
                                    ...prev,
                                    [f.email]: e.target.checked,
                                  }))
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t" style={{ borderColor: theme.border }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateCircle(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                      style={{
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        color: theme.muted,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!circleName.trim()}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer disabled:opacity-40"
                      style={{ background: theme.accent }}
                    >
                      Create Circle
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
