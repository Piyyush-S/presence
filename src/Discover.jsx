import { motion } from "framer-motion";

export default function Discover() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center text-gray-800 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-6"
    >
      <h1 className="text-4xl font-bold text-indigo-700 mb-3">Discover 🌍</h1>
      <p className="text-gray-600 text-center max-w-md">
        Explore people and shared moments around you.
        This is where new presence begins.
      </p>
    </motion.div>
  );
}
