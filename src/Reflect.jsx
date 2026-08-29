import { motion } from "framer-motion";
import { useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";

export default function Reflect() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [thoughts, setThoughts] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleFinish = () => {
    setCompleted(true);
    setTimeout(() => {
      window.location.href = "/"; // Navigate back to home (or use React Router)
    }, 2000);
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center text-gray-800 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {!completed ? (
        <>
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            Take a Moment 🌿
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 text-center max-w-md mb-10"
          >
            Reflect on how you’re feeling after your Presence Session.
          </motion.p>

          {/* Mood selection */}
          <div className="flex space-x-6 mb-10">
            {[
              { icon: Smile, label: "Calm & Recharged", color: "text-green-500" },
              { icon: Meh, label: "Neutral", color: "text-yellow-500" },
              { icon: Frown, label: "Drained", color: "text-red-500" },
            ].map(({ icon: Icon, label, color }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(label)}
                className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl shadow-md bg-white hover:shadow-lg transition ${
                  selectedMood === label
                    ? "ring-4 ring-indigo-400 ring-offset-2"
                    : ""
                }`}
              >
                <Icon className={`w-8 h-8 ${color}`} />
                <span className="text-sm font-medium">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* Optional reflection text */}
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            placeholder="Write your thoughts (optional)..."
            className="w-full max-w-md h-28 p-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none mb-8 resize-none bg-white shadow-sm"
          />

          {/* Finish Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedMood}
            onClick={handleFinish}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            Finish Reflection
          </motion.button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h2
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-3xl font-semibold text-indigo-600 mb-4"
          >
            Thank you 🌸
          </motion.h2>
          <p className="text-gray-600 text-lg">
            Your reflection helps build a calmer, more connected world.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
