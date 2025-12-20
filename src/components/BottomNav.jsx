import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function BottomNav({ active = "home", onNavigate }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState("✨ Feature coming soon!");

  const items = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "discover", label: "Discover", icon: "🔍" },
    { id: "chats", label: "Chats", icon: "💬" },
    { id: "reflect", label: "Reflect", icon: "😊" },
    { id: "profile", label: "Profile", icon: "🧑‍💼" },
  ];

  const handleClick = (id) => {
    if (id === "home") {
      onNavigate?.("home");
      return;
    }

    if (id === "profile") {
      onNavigate?.("profile");
      return;
    }

    if (id === "chats") {
      onNavigate?.("chats");
      return;
    }

    // 🔮 For unfinished features
    setPopupText("✨ Feature coming soon!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 1400);
  };

  return (
    <div className="w-full flex justify-around bg-white/80 backdrop-blur-lg rounded-t-2xl shadow-md py-2 relative">
      {items.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => handleClick(item.id)}
          className={`flex flex-col items-center text-sm transition ${
            active === item.id
              ? "text-indigo-600 font-semibold"
              : "text-gray-600 hover:text-indigo-500"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </motion.button>
      ))}

      {/* Centered popup above the nav */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center"
          >
            <div className="mb-28">
              <motion.div
                initial={{ y: 16 }}
                animate={{ y: 0 }}
                exit={{ y: 16 }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium"
              >
                {popupText}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
