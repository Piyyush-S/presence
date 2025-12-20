// src/pages/FriendsPage.jsx
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ---------- Small UI helper ---------- */
const Card = ({ children, className = "" }) => (
  <div
    className={
      "bg-white/90 backdrop-blur rounded-3xl shadow-sm hover:shadow-lg transition-shadow " +
      className
    }
  >
    {children}
  </div>
);

/* ---------- Friends Page ---------- */
export default function FriendsPage({ onBack, onOpenChat }) {
  const [friends, setFriends] = useState([]); // [{ email, profile, blocked, blockedBy }]
  const [myBlocked, setMyBlocked] = useState(new Set()); // emails I have blocked
  const [loading, setLoading] = useState(true);

  const rawUser =
    typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const myEmail = currentUser?.email || "";

  // 🔄 Watch my "friends" and assemble friend profiles
  useEffect(() => {
    if (!myEmail) return;

    setLoading(true);

    const unsub = onSnapshot(collection(db, "friends"), async (snap) => {
      try {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mine = all.filter(
          (f) => f.userA === myEmail || f.userB === myEmail
        );

        // fetch other profiles & blockedBy
        const rows = await Promise.all(
          mine.map(async (f) => {
            const other = f.userA === myEmail ? f.userB : f.userA;

            const ref = doc(db, "users", other);
            const profSnap = await getDoc(ref);
            const profile = profSnap.exists() ? profSnap.data() : { email: other };

            // did THEY block me?
            const blockedBySnap = await getDoc(
              doc(db, "users", other, "blocked", myEmail)
            );
            const blockedBy = blockedBySnap.exists();

            return { email: other, profile, blockedBy };
          })
        );

        setFriends(rows);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [myEmail]);

  // 🔄 Watch my own blocked set
  useEffect(() => {
    if (!myEmail) return;
    const unsub = onSnapshot(
      collection(db, "users", myEmail, "blocked"),
      (snap) => {
        const set = new Set(snap.docs.map((d) => d.id));
        setMyBlocked(set);
      }
    );
    return () => unsub();
  }, [myEmail]);

  // convenient map for quick lookup (email -> true/false)
  const blockedMap = useMemo(() => myBlocked, [myBlocked]);

  /* ---------- Actions ---------- */

  // ❌ Unfriend logic
  const handleUnfriend = async (otherEmail) => {
    if (!myEmail) return;
    const friendId = [myEmail, otherEmail].sort().join("_");
    try {
      await deleteDoc(doc(db, "friends", friendId));
      // optional: also clear chat thread, your call
      // await deleteDoc(doc(db, "chats", friendId));
      // await deleteDoc(doc(db, "lastSeen", friendId));
      alert("Unfriended successfully.");
    } catch (err) {
      console.error("Failed to unfriend:", err);
      alert("Could not unfriend right now.");
    }
  };

  // 🚫 Block
  const handleBlock = async (otherEmail) => {
    if (!myEmail) return;
    try {
      await setDoc(doc(db, "users", myEmail, "blocked", otherEmail), {
        blockedAt: serverTimestamp(),
      });
      // optional: also remove friendship immediately
      const friendId = [myEmail, otherEmail].sort().join("_");
      await deleteDoc(doc(db, "friends", friendId)).catch(() => {});
      alert("User blocked.");
    } catch (err) {
      console.error("Block failed:", err);
      alert("Could not block user right now.");
    }
  };

  // ✅ Unblock
  const handleUnblock = async (otherEmail) => {
    if (!myEmail) return;
    try {
      await deleteDoc(doc(db, "users", myEmail, "blocked", otherEmail));
      alert("User unblocked.");
    } catch (err) {
      console.error("Unblock failed:", err);
      alert("Could not unblock user right now.");
    }
  };

  // 💬 Open chat (only when both sides allow)
  const handleChat = (otherEmail, blockedBy) => {
    if (!myEmail) return;
    const iBlocked = blockedMap.has(otherEmail);
    if (iBlocked) {
      alert("You have blocked this user. Unblock to chat.");
      return;
    }
    if (blockedBy) {
      alert("This user has blocked you. You cannot chat.");
      return;
    }
    onOpenChat?.(otherEmail);
  };

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
          Your Friends
        </motion.h1>

        <button
          onClick={onBack}
          className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md text-indigo-600 font-medium transition"
        >
          ← Back
        </button>
      </header>

      <main className="flex-1 px-6 pb-20">
        {loading ? (
          <p className="text-gray-500 text-center mt-20">Loading friends…</p>
        ) : friends.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">
            You haven’t added any friends yet 😅
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {friends.map(({ email, profile, blockedBy }) => {
              const iBlocked = blockedMap.has(email);
              const canChat = !iBlocked && !blockedBy; // chat only if no blocking either way

              return (
                <Card
                  key={email}
                  className="p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        profile?.img ||
                        `https://i.pravatar.cc/120?u=${encodeURIComponent(email)}`
                      }
                      alt={profile?.name || email}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>{profile?.name || "Unknown"}</span>
                        {profile?.username ? (
                          <span className="text-gray-400 text-xs">
                            @{profile.username}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {(profile?.city || "Unknown").toString()}
                      </p>
                      {blockedBy ? (
                        <p className="text-xs mt-1 text-red-400">
                          This user has blocked you
                        </p>
                      ) : iBlocked ? (
                        <p className="text-xs mt-1 text-orange-500">
                          You have blocked this user
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Chat only if allowed */}
                    {canChat ? (
                      <button
                        onClick={() => handleChat(email, blockedBy)}
                        className="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Chat
                      </button>
                    ) : null}

                    {/* Unfriend */}
                    <button
                      onClick={() => handleUnfriend(email)}
                      className="px-3 py-1 rounded-full text-sm bg-gray-100 text-indigo-600 hover:bg-gray-200"
                    >
                      Unfriend
                    </button>

                    {/* Block / Unblock */}
                    {iBlocked ? (
                      <button
                        onClick={() => handleUnblock(email)}
                        className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(email)}
                        className="px-3 py-1 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        Block
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
