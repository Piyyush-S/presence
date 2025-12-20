// src/components/IncomingCallModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function IncomingCallModal({
  open,
  callerName,
  onAccept,
  onReject,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-[92%] max-w-md p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-gray-800">Incoming call</h3>
            <p className="text-sm text-gray-500 mt-1">
              {callerName || "Someone"} is calling you…
            </p>

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={onReject}
                className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
