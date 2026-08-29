// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Bell,
  Check,
  X,
  Clock,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";

export default function Notifications({
  onBack,
  onOpenFriends,
  onOpenNotifications,
  onOpenProfile,
  onOpenChats,
  onLogout,
}) {
  const { theme } = useTheme();

  /* ---------------- State ---------------- */
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incoming"); // "incoming" | "outgoing" | "activity"

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* ---------------- Realtime Requests Listener ---------------- */
  useEffect(() => {
    if (!currentUser?.email) return;
    setLoading(true);
    const q = collection(db, "friendRequests");

    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setIncoming(
          all.filter((r) => r.to === currentUser.email && r.status === "pending")
        );
        setOutgoing(
          all.filter((r) => r.from === currentUser.email && r.status === "pending")
        );
        setLoading(false);
      },
      (err) => {
        console.warn("Notifications listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.email]);

  /* ---------------- Actions ---------------- */
  const acceptRequest = async (reqId, fromEmail, toEmail) => {
    try {
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      const friendId = [fromEmail, toEmail].sort().join("_");
      await setDoc(doc(db, "friends", friendId), {
        userA: fromEmail,
        userB: toEmail,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const rejectRequest = async (reqId) => {
    try {
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const cancelRequest = async (reqId) => {
    try {
      await deleteDoc(doc(db, "friendRequests", reqId));
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };

  return (
    <AppShell
      active="notifications"
      notificationCount={incoming.length}
      onNavigate={(t) => {
        if (t === "home") onBack?.();
        if (t === "friends") onOpenFriends?.();
        if (t === "chats") onOpenChats?.();
        if (t === "profile") onOpenProfile?.();
      }}
      onLogout={onLogout}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 w-full">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-normal tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: theme.fg }}
            >
              Presence Alerts
            </h1>
            <p className="text-xs mt-1" style={{ color: theme.muted }}>
              Invitations to connect and quiet activity updates.
            </p>
          </div>

          {/* Tabs */}
          <div
            className="p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto border"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <button
              onClick={() => setTab("incoming")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: tab === "incoming" ? theme.fg : "transparent",
                color: tab === "incoming" ? theme.bg : theme.muted,
              }}
            >
              <span>Incoming</span>
              {incoming.length > 0 && (
                <span
                  className="px-1.5 py-0.2 text-[9px] font-bold rounded-full text-white"
                  style={{ background: theme.accent }}
                >
                  {incoming.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("outgoing")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: tab === "outgoing" ? theme.fg : "transparent",
                color: tab === "outgoing" ? theme.bg : theme.muted,
              }}
            >
              Sent ({outgoing.length})
            </button>
            <button
              onClick={() => setTab("activity")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: tab === "activity" ? theme.fg : "transparent",
                color: tab === "activity" ? theme.bg : theme.muted,
              }}
            >
              Activity
            </button>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-xs" style={{ color: theme.muted }}>
            Checking presence alerts…
          </div>
        ) : tab === "incoming" ? (
          /* ================= INCOMING REQUESTS ================= */
          incoming.length === 0 ? (
            <div className="p-8 rounded-2xl border text-center" style={{ background: theme.card, borderColor: theme.border }}>
              <Bell size={28} className="mx-auto mb-2" style={{ color: theme.muted }} />
              <h3 className="text-base font-medium mb-1" style={{ color: theme.fg }}>
                No incoming requests
              </h3>
              <p className="text-xs" style={{ color: theme.muted }}>
                You're all caught up. No pending presence requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incoming.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar email={req.from} size={44} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                        {req.from?.split("@")[0]}
                      </h4>
                      <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                        {req.from} wants to share presence with you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => acceptRequest(req.id, req.from, req.to)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white cursor-pointer shadow-sm"
                      style={{ background: theme.accent }}
                    >
                      <Check size={13} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="p-2 rounded-xl text-xs transition-colors cursor-pointer"
                      style={{
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        color: theme.muted,
                      }}
                      title="Ignore"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : tab === "outgoing" ? (
          /* ================= SENT REQUESTS ================= */
          outgoing.length === 0 ? (
            <div className="p-8 rounded-2xl border text-center" style={{ background: theme.card, borderColor: theme.border }}>
              <Clock size={28} className="mx-auto mb-2" style={{ color: theme.muted }} />
              <h3 className="text-base font-medium mb-1" style={{ color: theme.fg }}>
                No pending sent requests
              </h3>
              <p className="text-xs" style={{ color: theme.muted }}>
                Requests you send will appear here until accepted.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar email={req.to} size={44} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: theme.fg }}>
                        {req.to?.split("@")[0]}
                      </h4>
                      <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                        Request pending with {req.to}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelRequest(req.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      color: theme.muted,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
                  >
                    Cancel
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* ================= ACTIVITY TAB ================= */
          <div className="space-y-3">
            {[
              {
                id: "act-1",
                icon: Radio,
                title: "Presence Active",
                desc: "You are currently sharing presence in Pause.",
                time: "Now",
              },
              {
                id: "act-2",
                icon: ShieldCheck,
                title: "Privacy Protected",
                desc: "No public follower metrics or streaks are tracked.",
                time: "Ongoing",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.accent }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: theme.fg }}>
                        {item.title}
                      </h4>
                      <p className="text-xs" style={{ color: theme.muted }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium" style={{ color: theme.mutedMore }}>
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
