// src/pages/ChatsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
import { db } from "../firebase";


export default function ChatsPage({ onBack, onOpenChat }) {
  const raw = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const me = raw ? JSON.parse(raw) : null;

  const [search, setSearch] = useState("");
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);     // for “start DM”
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState({});   // group create: selected members

  // my chats
  useEffect(() => {
    if (!me?.email) return;
    const unsub = onSnapshot(collection(db, "chats"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => (c.participants || []).includes(me.email) || c.type === "group"); // you may filter to groups the user is in if you store members separately
      setChats(list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
    });
    return () => unsub();
  }, [me?.email]);

  // friend list
  useEffect(() => {
    if (!me?.email) return;
    const run = async () => {
      const fsnap = await getDocs(collection(db, "friends"));
      const my = [];
      for (const docu of fsnap.docs) {
        const it = docu.data();
        if (it.userA === me.email || it.userB === me.email) {
          const other = it.userA === me.email ? it.userB : it.userA;
          my.push(other);
        }
      }
      // fetch their user docs
      const users = [];
      for (const em of my) {
        const s = await getDocs(query(collection(db, "users"), where("email", "==", em)));
        s.forEach((d) => users.push(d.data()));
      }
      setFriends(users);
    };
    run();
  }, [me?.email]);

  const filteredChats = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return chats;
    return chats.filter((c) => {
      const name = c.type === "group"
        ? (c.groupName || c.name || "Group")
        : (c.participants || []).find((p) => p !== me.email)?.split("@")[0] || "Chat";
      return name.toLowerCase().includes(t) || (c.lastMessage || "").toLowerCase().includes(t);
    });
  }, [chats, search, me?.email]);

  const startDM = async (email) => {
    const chatId = [me.email, email].sort().join("_");
    await setDoc(
      doc(db, "chats", chatId),
      {
        type: "dm",
        participants: [me.email, email],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    localStorage.setItem("chatWith", email);
    onOpenChat?.(email);
  };

  const toggleMember = (email) => {
    setSelected((s) => ({ ...s, [email]: !s[email] }));
  };

  const createGroup = async () => {
    const members = Object.keys(selected).filter((k) => selected[k]);
    if (!groupName.trim() || members.length === 0) return;
    const chatId = `group_${Date.now()}`;
    await setDoc(doc(db, "chats", chatId), {
      type: "group",
      participants: Array.from(new Set([me.email, ...members])),
      groupName: groupName.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
    setGroupName("");
    setSelected({});
    localStorage.setItem("chatWith", chatId);
    onOpenChat?.(chatId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="flex items-center justify-between p-5">
        <h1 className="text-2xl font-bold text-indigo-700">Chats</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white rounded-full shadow text-indigo-600 hover:shadow-md"
        >
          ← Back
        </button>
      </header>

      {/* Search */}
      <div className="px-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats by name or message..."
          className="w-full px-4 py-2 rounded-full border border-indigo-100 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      </div>

      {/* Start DM */}
      <section className="px-5 mt-6">
        <h2 className="text-sm text-gray-600 font-medium mb-2">Start a DM</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends yet.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {friends.map((f) => (
              <button
                key={f.email}
                onClick={() => startDM(f.email)}
                className="px-3 py-2 bg-white rounded-full shadow text-sm hover:shadow-md whitespace-nowrap"
              >
                {f.name || f.email.split("@")[0]}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Create Group */}
      <section className="px-5 mt-6">
        <h2 className="text-sm text-gray-600 font-medium mb-2">Create a Group</h2>
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 rounded-xl border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {friends.map((f) => (
              <label
                key={f.email}
                className={`px-3 py-2 rounded-xl border cursor-pointer ${
                  selected[f.email] ? "bg-indigo-50 border-indigo-300" : "bg-white border-indigo-100"
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={!!selected[f.email]}
                  onChange={() => toggleMember(f.email)}
                />
                <span className="text-sm">{f.name || f.email.split("@")[0]}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={createGroup}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow"
            >
              Create
            </button>
          </div>
        </div>
      </section>

      {/* Chats list */}
      <main className="px-5 py-6 space-y-3">
        {filteredChats.length === 0 ? (
          <p className="text-sm text-gray-400">No chats yet.</p>
        ) : (
          filteredChats.map((c) => {
            const isGroup = c.type === "group";
            const name = isGroup
              ? c.groupName || "Group"
              : (c.participants || []).find((p) => p !== me.email) || "Chat";
            const chatWith = isGroup ? c.id : name;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.setItem("chatWith", isGroup ? c.id : (c.participants.find(p => p !== me.email) || ""));
                  onOpenChat?.(isGroup ? c.id : (c.participants.find(p => p !== me.email) || ""));
                }}
                className="w-full bg-white/80 rounded-2xl px-4 py-3 shadow hover:shadow-md text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        isGroup
                          ? "https://api.iconify.design/mdi:account-group.svg?color=%238b5cf6"
                          : `https://i.pravatar.cc/100?u=${chatWith}`
                      }
                      alt=""
                      className="w-10 h-10 rounded-full border"
                    />
                    <div>
                      <p className="font-semibold text-gray-700">
                        {isGroup ? name : name.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[220px]">
                        {c.lastMessage || "—"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {c.updatedAt?.toDate
                      ? c.updatedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </main>
    </div>
  );
}
