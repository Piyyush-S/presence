import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Notifications({ onBack }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const rawUser =
    typeof window !== "undefined"
      ? localStorage.getItem("presenceUser")
      : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  /* 🕒 Realtime listener for friendRequests */
  useEffect(() => {
    if (!currentUser?.email) return;
    const q = collection(db, "friendRequests");

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncoming(
        all.filter(
          (r) => r.to === currentUser.email && r.status === "pending"
        )
      );
      setOutgoing(
        all.filter(
          (r) => r.from === currentUser.email && r.status === "pending"
        )
      );
    });

    return () => unsub();
  }, [currentUser]);

  /* ⚙️ Actions */

  // ✅ Accept request + create friendship record
  const acceptRequest = async (reqId, fromEmail, toEmail) => {
    try {
      // 1️⃣ Mark the friend request as accepted
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // 2️⃣ Create a friend record for both users
      const friendId = [fromEmail, toEmail].sort().join("_"); // consistent ID
      await setDoc(doc(db, "friends", friendId), {
        userA: fromEmail,
        userB: toEmail,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Friendship created:", friendId);
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request");
    }
  };

  const rejectRequest = async (reqId) => {
    try {
      await updateDoc(doc(db, "friendRequests", reqId), {
        status: "rejected",
      });
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject request");
    }
  };

  const cancelRequest = async (reqId) => {
    try {
      await deleteDoc(doc(db, "friendRequests", reqId));
    } catch (err) {
      console.error("Error cancelling request:", err);
      alert("Failed to cancel request");
    }
  };

  /* 💎 UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold text-indigo-700 tracking-tight"
        >
          Notifications
        </motion.h1>
        <button
          onClick={onBack}
          className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md text-indigo-600 font-medium transition"
        >
          ← Back
        </button>
      </header>

      <main className="flex-1 px-6 pb-10">
        {/* Incoming Requests */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Incoming Friend Requests 📥
          </h2>

          {incoming.length === 0 ? (
            <p className="text-sm text-gray-500">
              No new friend requests right now.
            </p>
          ) : (
            <div className="space-y-4">
              {incoming.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-800 font-medium">{req.from}</p>
                    <p className="text-xs text-gray-500">wants to connect</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        acceptRequest(req.id, req.from, req.to)
                      }
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="bg-red-400 text-white px-3 py-1 rounded-full text-sm hover:bg-red-500"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Outgoing Requests */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Sent Requests 📤
          </h2>

          {outgoing.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven’t sent any friend requests.
            </p>
          ) : (
            <div className="space-y-4">
              {outgoing.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-800 font-medium">{req.to}</p>
                    <p className="text-xs text-gray-500">
                      request pending...
                    </p>
                  </div>
                  <button
                    onClick={() => cancelRequest(req.id)}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
