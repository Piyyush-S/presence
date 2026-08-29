// src/pages/GroupsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { ArrowLeft, Plus, Users, Send, X, Sun, Moon } from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/Avatar";
import AmbientBackground from "../components/AmbientBackground";
import EmptyState from "../components/EmptyState";

export default function GroupsPage({ onBack }) {
  const { dark, toggleDark, theme } = useTheme();

  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef();

  const rawUser = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* Load groups */
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = onSnapshot(collection(db, "groups"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => g.members?.includes(currentUser.email));
      setGroups(list);
    });
    return () => unsub();
  }, [currentUser]);

  /* Load group messages */
  useEffect(() => {
    if (!selectedGroup) return;
    const unsub = onSnapshot(
      collection(db, "groupMessages", selectedGroup.id, "messages"),
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
        setMessages(msgs);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    );
    return () => unsub();
  }, [selectedGroup]);

  const createGroup = async () => {
    if (!groupName.trim() || !currentUser?.email) return;
    const docRef = await addDoc(collection(db, "groups"), {
      name: groupName.trim(),
      createdBy: currentUser.email,
      members: [currentUser.email],
      createdAt: serverTimestamp(),
    });
    setGroupName("");
    setShowCreate(false);
    setSelectedGroup({ id: docRef.id, name: groupName.trim(), members: [currentUser.email] });
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedGroup || !currentUser?.email) return;
    await addDoc(collection(db, "groupMessages", selectedGroup.id, "messages"), {
      from: currentUser.email,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 h-screen overflow-hidden relative"
      style={{ background: theme.bg, color: theme.fg }}
    >
      <AmbientBackground />

      {/* Header */}
      <header
        className="px-6 h-16 flex items-center justify-between border-b flex-shrink-0 z-30 transition-colors"
        style={{
          background: dark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={selectedGroup ? () => setSelectedGroup(null) : onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.fg,
            }}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1
            className="text-xl font-normal tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {selectedGroup ? selectedGroup.name : "Presence Circles"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!selectedGroup && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.fg,
              }}
            >
              <Plus size={14} />
              <span>New Circle</span>
            </button>
          )}

          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.fg,
            }}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      {!selectedGroup ? (
        <main className="flex-1 overflow-y-auto max-w-4xl mx-auto p-6 w-full space-y-3">
          {groups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No circles yet"
              description="Create a presence circle to bring friends together for quiet group conversations."
              actionText="Create Circle"
              onAction={() => setShowCreate(true)}
            />
          ) : (
            groups.map((g) => (
              <motion.div
                key={g.id}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedGroup(g)}
                className="p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer"
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: theme.accentMuted,
                      border: `1px solid ${theme.accentBorder}`,
                      color: theme.accent,
                    }}
                  >
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: theme.fg }}>
                      {g.name}
                    </h3>
                    <p className="text-[11px]" style={{ color: theme.muted }}>
                      {g.members?.length || 1} members
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </main>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
          {/* Messages */}
          <main className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {messages.map((m) => {
              const mine = m.from === currentUser?.email;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  {!mine && (
                    <span className="text-[10px] mb-1 px-1 font-medium" style={{ color: theme.muted }}>
                      {m.from?.split("@")[0]}
                    </span>
                  )}
                  <div
                    className="max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed"
                    style={{
                      background: mine ? theme.accent : theme.card,
                      color: mine ? "#ffffff" : theme.fg,
                      border: mine ? "none" : `1px solid ${theme.border}`,
                      borderRadius: mine
                        ? "14px 14px 2px 14px"
                        : "14px 14px 14px 2px",
                    }}
                  >
                    <p>{m.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </main>

          {/* Chat input */}
          <footer
            className="p-4 border-t flex items-center gap-3"
            style={{
              background: dark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
              borderColor: theme.border,
            }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message circle…"
              className="flex-1 px-4 py-2.5 rounded-xl text-xs outline-none"
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.fg,
                fontFamily: "'Manrope', sans-serif",
              }}
            />
            <button
              onClick={sendMessage}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer"
              style={{ background: theme.accent }}
            >
              <Send size={15} />
            </button>
          </footer>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <div
              className="w-full max-w-sm p-6 rounded-2xl relative space-y-4"
              style={{
                background: dark ? "#0d0d0d" : "#ffffff",
                border: `1px solid ${theme.border}`,
              }}
            >
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X size={16} />
              </button>

              <h2 className="text-lg font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                Create Circle
              </h2>

              <input
                type="text"
                placeholder="Circle name…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none"
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  color: theme.fg,
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.muted,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim()}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                  style={{ background: theme.accent }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
