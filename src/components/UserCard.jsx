// src/components/UserCard.jsx
import React from "react";
import { motion } from "framer-motion";

export default function UserCard({
  me,
  user,
  relation,        // "none" | "friends" | "requested" | "incoming" | "blocked" | "you"
  onView,
  onRequest,
  onAccept,
  onReject,
  onUnfriend,
  onBlock,
  onUnblock
}) {
  const disabled = relation === "you" || relation === "blocked";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center gap-2"
    >
      <img
        src={user.img || "https://i.pravatar.cc/100?u=" + user.email}
        alt={user.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div className="text-center">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-gray-500">{user.mood || "—"}</p>
        <p className="text-xs text-gray-400">{user.city || ""}</p>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap justify-center">
        <button
          onClick={() => onView(user)}
          className="px-3 py-1 rounded-full border text-sm"
        >
          View
        </button>

        {relation === "none" && (
          <button
            onClick={() => onRequest(user)}
            className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm"
          >
            Add Friend
          </button>
        )}

        {relation === "requested" && (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
            Requested
          </span>
        )}

        {relation === "incoming" && (
          <>
            <button
              onClick={() => onAccept(user)}
              className="px-3 py-1 rounded-full bg-green-600 text-white text-sm"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(user)}
              className="px-3 py-1 rounded-full bg-gray-200 text-sm"
            >
              Reject
            </button>
          </>
        )}

        {relation === "friends" && (
          <button
            onClick={() => onUnfriend(user)}
            className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm"
          >
            Unfriend
          </button>
        )}

        {!disabled && (
          <>
            {relation !== "blocked" ? (
              <button
                onClick={() => onBlock(user)}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                Block
              </button>
            ) : (
              <button
                onClick={() => onUnblock(user)}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                Unblock
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
