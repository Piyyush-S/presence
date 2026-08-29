import { motion } from "framer-motion";

function LandingPage({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex flex-col items-center justify-center text-gray-800 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
    >
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Presence Grid</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl text-center">
        Where digital connection meets real presence.  
        A calm space for genuine human moments in a noisy world.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl shadow-md hover:bg-indigo-700 transition text-lg"
      >
        Try the Prototype
      </motion.button>
    </motion.div>
  );
}

export default LandingPage;
