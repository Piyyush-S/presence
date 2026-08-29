// src/pages/FriendsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search,
  ShieldCheck,
  Users,
  Check,
  X,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AppShell from "../components/AppShell";
import UserCard from "../components/UserCard";
import Avatar from "../components/Avatar";

export default function FriendsPage({
  onBack,
  onOpenChat,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats,
  onLogout,
}) {
  const { theme } = useTheme();

  /* ---------------- State ---------------- */
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [myBlocked, setMyBlocked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("friends"); // "friends" | "requests" | "blocked"

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const myEmail = currentUser?.email || "";

  /* ---------------- Realtime Friends Listener ---------------- */
  useEffect(() => {
    if (!myEmail) return;
    setLoading(true);

    const unsub = onSnapshot(
      collection(db, "friends"),
      async (snap) => {
        const friendEmailsList = [];
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userA === myEmail) friendEmailsList.push(d.userB);
          if (d.userB === myEmail) friendEmailsList.push(d.userA);
        });

        // Fetch profiles
        const results = await Promise.all(
          friendEmailsList.map(async (email) => {
            try {
              const uSnap = await getDoc(doc(db, "users", email));
              return {
                email,
                profile: uSnap.exists() ? uSnap.data() : { email, name: email.split("@")[0] },
              };
            } catch (_) {
              return { email, profile: { email, name: email.split("@")[0] } };
            }
          })
        );

        setFriends(results);
        setLoading(false);
      },
      (err) => {
        console.warn("Friends listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [myEmail]);

  /* ---------------- Realtime All Users (for Discover People) ---------------- */
  useEffect(() => {
    if (!myEmail) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.email && u.email !== myEmail);
      setAllUsers(list);
    });
    return () => unsub();
  }, [myEmail]);

  /* ---------------- Realtime Requests Listener ---------------- */
  useEffect(() => {
    if (!myEmail) return;
    const unsub = onSnapshot(collection(db, "friendRequests"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncomingRequests(all.filter((r) => r.to === myEmail && r.status === "pending"));
      setOutgoingRequests(all.filter((r) => r.from === myEmail && r.status === "pending"));
    });
    return () => unsub();
  }, [myEmail]);

  /* ---------------- Realtime Blocked Listener ---------------- */
  useEffect(() => {
    if (!myEmail) return;
    const unsub = onSnapshot(doc(db, "blocked", myEmail), (snap) => {
      if (snap.exists()) {
        setMyBlocked(new Set(snap.data().emails || []));
      } else {
        setMyBlocked(new Set());
      }
    });
    return () => unsub();
  }, [myEmail]);

  /* ---------------- Actions ---------------- */
  const handleChat = (email) => {
    localStorage.setItem("chatWith", email);
    onOpenChats?.();
  };

  const handleUnfriend = async (peerEmail) => {
    if (!window.confirm(`Disconnect from ${peerEmail}?`)) return;
    const idA = `${myEmail}_${peerEmail}`;
    const idB = `${peerEmail}_${myEmail}`;
    try {
      await deleteDoc(doc(db, "friends", idA));
      await deleteDoc(doc(db, "friends", idB));
    } catch (e) {
      console.warn("Unfriend error:", e);
    }
  };

  const handleBlock = async (peerEmail) => {
    if (!window.confirm(`Block ${peerEmail}? They will not be able to connect with you.`)) return;
    const updated = new Set(myBlocked);
    updated.add(peerEmail);
    setMyBlocked(updated);

    try {
      await setDoc(doc(db, "blocked", myEmail), {
        emails: Array.from(updated),
        updatedAt: serverTimestamp(),
      });
      // also remove friend
      await deleteDoc(doc(db, "friends", `${myEmail}_${peerEmail}`));
      await deleteDoc(doc(db, "friends", `${peerEmail}_${myEmail}`));
    } catch (e) {
      console.warn("Block error:", e);
    }
  };

  const handleUnblock = async (peerEmail) => {
    const updated = new Set(myBlocked);
    updated.delete(peerEmail);
    setMyBlocked(updated);

    try {
      await setDoc(doc(db, "blocked", myEmail), {
        emails: Array.from(updated),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Unblock error:", e);
    }
  };

  const handleAcceptRequest = async (reqId, fromEmail) => {
    try {
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
      const friendId = [fromEmail, myEmail].sort().join("_");
      await setDoc(doc(db, "friends", friendId), {
        userA: fromEmail,
        userB: myEmail,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const handleCancelRequest = async (reqId) => {
    try {
      await deleteDoc(doc(db, "friendRequests", reqId));
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };

  const handleSendRequest = async (toEmail) => {
    try {
      await addDoc(collection(db, "friendRequests"), {
        from: myEmail,
        to: toEmail,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  /* ---------------- Filtering ---------------- */
  const friendEmailSet = useMemo(() => new Set(friends.map((f) => f.email)), [friends]);
  const outgoingPendingSet = useMemo(() => new Set(outgoingRequests.map((r) => r.to)), [outgoingRequests]);

  const filteredFriends = useMemo(() => {
    return friends.filter(({ email, profile }) => {
      if (myBlocked.has(email)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        profile?.name?.toLowerCase().includes(q) ||
        profile?.username?.toLowerCase().includes(q) ||
        profile?.city?.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q)
      );
    });
  }, [friends, myBlocked, search]);

  const discoverPeople = useMemo(() => {
    return allUsers.filter((u) => {
      if (friendEmailSet.has(u.email)) return false;
      if (myBlocked.has(u.email)) return false;
      if (u.discoverable === false) return false;
      return true;
    });
  }, [allUsers, friendEmailSet, myBlocked]);

  const totalRequestsCount = incomingRequests.length + outgoingRequests.length;
  const blockedList = Array.from(myBlocked);

  return (
    <AppShell
      active="friends"
      notificationCount={incomingRequests.length}
      onNavigate={(t) => {
        if (t === "home") onBack?.();
        if (t === "chats") onOpenChats?.();
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
              Your Connections
            </h1>
            <p className="text-xs mt-1" style={{ color: theme.muted }}>
              Manage your connected circle and explore new presence.
            </p>
          </div>

          {/* Tabs */}
          <div
            className="p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto border"
            style={{
              background: theme.card,
              borderColor: theme.border,
            }}
          >
            <button
              onClick={() => setTab("friends")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: tab === "friends" ? theme.fg : "transparent",
                color: tab === "friends" ? theme.bg : theme.muted,
              }}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setTab("requests")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: tab === "requests" ? theme.fg : "transparent",
                color: tab === "requests" ? theme.bg : theme.muted,
              }}
            >
              <span>Requests</span>
              {totalRequestsCount > 0 && (
                <span
                  className="px-1.5 py-0.2 text-[9px] font-bold rounded-full"
                  style={{
                    background: tab === "requests" ? theme.bg : theme.accent,
                    color: tab === "requests" ? theme.fg : "#ffffff",
                  }}
                >
                  {totalRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("blocked")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: tab === "blocked" ? theme.fg : "transparent",
                color: tab === "blocked" ? theme.bg : theme.muted,
              }}
            >
              Blocked ({blockedList.length})
            </button>
          </div>
        </header>

        {/* ================= TAB 1: FRIENDS ================= */}
        {tab === "friends" && (
          <div className="space-y-8">
            {/* Search */}
            <div className="relative max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: theme.muted }}
              />
              <input
                type="text"
                placeholder="Search friends by name or location…"
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

            {/* Friends Section */}
            {loading ? (
              <div className="py-20 text-center text-xs" style={{ color: theme.muted }}>
                Loading your connections…
              </div>
            ) : filteredFriends.length === 0 ? (
              /* Compact Empty State */
              <div
                className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ background: theme.card, borderColor: theme.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                  >
                    <Users size={18} style={{ color: theme.muted }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: theme.fg }}>
                      No connections yet.
                    </h4>
                    <p className="text-xs" style={{ color: theme.muted }}>
                      Connect with people around you to share quiet moments together.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("discover-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  style={{ background: theme.accent }}
                >
                  Discover People
                </button>
              </div>
            ) : (
              /* Populated Friends Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFriends.map(({ email, profile }) => (
                  <UserCard
                    key={email}
                    user={{ email, ...profile }}
                    isFriend={true}
                    onChat={(em) => handleChat(em)}
                    onView={() => handleChat(email)}
                    onUnfriend={(em) => handleUnfriend(em)}
                    onBlock={(em) => handleBlock(em)}
                  />
                ))}
              </div>
            )}

            {/* ================= DISCOVER PEOPLE SECTION ================= */}
            <section id="discover-section" className="pt-6 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className="text-lg font-normal tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
                  >
                    Discover People to Connect With
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                    People sharing presence in the space right now.
                  </p>
                </div>
              </div>

              {discoverPeople.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: theme.muted }}>
                  No new people to discover at this moment. Check back soon.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverPeople.slice(0, 6).map((u) => {
                    const isRequested = outgoingPendingSet.has(u.email);
                    return (
                      <UserCard
                        key={u.email}
                        user={u}
                        isFriend={false}
                        isRequested={isRequested}
                        onRequest={(em) => handleSendRequest(em)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= TAB 2: REQUESTS ================= */}
        {tab === "requests" && (
          <div className="space-y-8 max-w-3xl">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>
                Incoming Requests ({incomingRequests.length})
              </h3>
              {incomingRequests.length === 0 ? (
                <div className="p-6 rounded-2xl border text-center text-xs" style={{ background: theme.card, borderColor: theme.border, color: theme.muted }}>
                  No pending incoming requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                      style={{ background: theme.card, borderColor: theme.border }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar email={req.from} size={42} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                            {req.from.split("@")[0]}
                          </h4>
                          <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                            {req.from} wants to share presence with you
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.from)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                          style={{ background: theme.accent }}
                        >
                          <Check size={13} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                          style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
                          title="Ignore"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>
                Sent Requests ({outgoingRequests.length})
              </h3>
              {outgoingRequests.length === 0 ? (
                <div className="p-6 rounded-2xl border text-center text-xs" style={{ background: theme.card, borderColor: theme.border, color: theme.muted }}>
                  No pending sent requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                      style={{ background: theme.card, borderColor: theme.border }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar email={req.to} size={42} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                            {req.to.split("@")[0]}
                          </h4>
                          <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                            Request pending with {req.to}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: BLOCKED ================= */}
        {tab === "blocked" && (
          <div className="space-y-4 max-w-2xl">
            {blockedList.length === 0 ? (
              <div className="p-8 rounded-2xl border text-center" style={{ background: theme.card, borderColor: theme.border }}>
                <ShieldCheck size={28} className="mx-auto mb-2" style={{ color: theme.muted }} />
                <h4 className="text-sm font-semibold mb-1" style={{ color: theme.fg }}>
                  No blocked users
                </h4>
                <p className="text-xs" style={{ color: theme.muted }}>
                  Users you block will appear here.
                </p>
              </div>
            ) : (
              blockedList.map((email) => (
                <div
                  key={email}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar email={email} size={40} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                        {email}
                      </h4>
                      <span className="text-[10px]" style={{ color: theme.danger }}>
                        Blocked
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(email)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.fg }}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
