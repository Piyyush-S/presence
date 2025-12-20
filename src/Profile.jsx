import { motion } from "framer-motion";
import { User, Mail, Edit3, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import BottomNav from "./BottomNav";

export default function Profile() {
  const [userData, setUserData] = useState({
    name: "Guest",
    email: "unknown@example.com",
  });

 useEffect(() => {
  let storedUser = null;
  const rawUser = localStorage.getItem("presenceUser");

  try {
    storedUser = JSON.parse(rawUser);
  } catch {
    // Handle older plain email data
    if (typeof rawUser === "string" && rawUser.includes("@")) {
      storedUser = { name: rawUser.split("@")[0], email: rawUser };
    }
  }

  if (storedUser) {
    setUserData(storedUser);
  }
}, []);


  const handleLogout = () => {
    localStorage.removeItem("presenceUser");
    window.location.reload(); // simple redirect to login screen
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-between pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mt-10"
      >
        <h1 className="text-3xl font-bold text-indigo-700">Your Profile</h1>
        <p className="text-gray-500 mt-1">Welcome back to Presence Grid 🌿</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-2xl rounded-3xl p-8 w-11/12 max-w-md mt-6 text-center"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src="https://i.ibb.co/h2fpczN/default-avatar.png"
              alt="User Avatar"
              className="w-24 h-24 rounded-full shadow-md object-cover border-2 border-indigo-400"
            />
            <button
              className="absolute bottom-1 right-1 bg-indigo-500 text-white p-1 rounded-full hover:bg-indigo-600 transition"
              onClick={() => alert("Profile editing coming soon ✨")}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-indigo-700 mt-4">
            {userData.name}
          </h2>
          <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
            <Mail className="w-4 h-4 text-indigo-400" /> {userData.email}
          </p>
        </div>

        <div className="mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </motion.button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <BottomNav active="profile" />
      </div>
    </div>
  );
}
