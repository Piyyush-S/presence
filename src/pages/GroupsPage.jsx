import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";

export default function GroupsPage({ onBack }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef();

  const rawUser =
    typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* 🧩 Load all groups where user is a member */
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

  /* 💬 Load group messages */
  useEffect(() => {
    if (!selectedGroup) return;
    const unsub = onSnapshot(
      collection(db, "groupMessages", selectedGroup.id, "messages"),
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
        setMessages(msgs);
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    );
    return () => unsub();
  }, [selectedGroup]);

  /* ➕ Create new group */
  const createGroup = async () => {
    if (!groupName.trim()) return;
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

  /* ✉️ Send group message */
  const sendMessage = async () => {
    if (!text.trim() || !selectedGroup) return;
    await addDoc(collection(db, "groupMessages", selectedGroup.id, "messages"), {
      from: currentUser.email,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  /* ➕ Add member */
  const addMember = async (email) => {
    if (!selectedGroup) return;
    const ref = doc(db, "groups", selectedGroup.id);
    await updateDoc(ref, {
      members: arrayUnion(email),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="flex items-center justify-between p-5 bg-white/80 backdrop-blur border-b">
        <button
          onClick={onBack}
          className="text-indigo-600 font-medium flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-gray-700">Groups</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 rounded-full bg-indigo-500 text-white text-sm shadow hover:bg-indigo-600"
        >
          + New
        </button>
      </header>

      {/* Groups list */}
      {!selectedGroup ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {groups.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              You aren’t in any groups yet.
            </p>
          ) : (
            groups.map((g) => (
              <motion.div
                key={g.id}
                onClick={() => setSelectedGroup(g)}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md"
              >
                <div>
                  <h2 className="font-semibold text-gray-700">{g.name}</h2>
                  <p className="text-xs text-gray-400">
                    {g.members?.length || 0} members
                  </p>
                </div>
                <span className="text-lg">💬</span>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Group chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                ref={scrollRef}
                className={`flex ${
                  m.from === currentUser.email ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] shadow ${
                    m.from === currentUser.email
                      ? "bg-indigo-100 text-gray-800"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <p className="text-sm">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <footer className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur border-t border-gray-200">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message this group..."
              className="flex-1 rounded-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              className="bg-indigo-500 text-white px-5 py-2 rounded-full hover:bg-indigo-600 shadow-md text-sm"
            >
              Send
            </motion.button>
          </footer>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-lg w-80"
          >
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Create Group
            </h2>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full mb-4 p-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-full"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
