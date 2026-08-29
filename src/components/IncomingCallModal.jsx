import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";

export default function IncomingCallModal({
  open,
  callerName,
  callerEmail,
  callerImg,
  onAccept,
  onReject,
}) {
  const { dark, theme } = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm p-8 text-center flex flex-col items-center"
            style={{
              background: dark ? "#0d0d0d" : "#ffffff",
              border: `1px solid ${theme.border}`,
              borderRadius: 20,
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="relative mb-5">
              <Avatar
                src={callerImg}
                name={callerName}
                email={callerEmail}
                size={76}
                aura={theme.accent}
              />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping"
                style={{ background: theme.accent }}
              />
            </div>

            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: theme.accent, fontWeight: 600 }}
            >
              Incoming Call
            </p>

            <h3
              className="text-xl font-medium"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: theme.fg,
              }}
            >
              {callerName || "Someone"}
            </h3>

            <p className="text-xs mt-1 mb-8" style={{ color: theme.muted }}>
              {callerEmail ? callerEmail : "wants to start a conversation with you"}
            </p>

            <div className="flex items-center justify-center gap-6 w-full">
              {/* Decline */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReject}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                style={{
                  background: theme.dangerBg,
                  border: `1px solid ${theme.danger}`,
                  color: theme.danger,
                }}
              >
                <PhoneOff size={16} />
                Decline
              </motion.button>

              {/* Accept */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white shadow-lg transition-all"
                style={{
                  background: theme.accent,
                  border: "none",
                }}
              >
                <Phone size={16} />
                Accept
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
