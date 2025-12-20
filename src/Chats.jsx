import { motion } from "framer-motion";

export default function Chats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center text-gray-800 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6"
    >
      <h1 className="text-4xl font-bold text-indigo-700 mb-3">Chats 💬</h1>
      <p className="text-gray-600 text-center max-w-md">
        Conversations that matter — calm, honest, and human.
        Chat features will appear here soon.
      </p>
    </motion.div>
  );
}
