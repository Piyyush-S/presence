// src/pages/ChatPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  MoreVertical,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/Avatar";
import IncomingCallModal from "../components/IncomingCallModal";
import AmbientBackground from "../components/AmbientBackground";
import useAudio from "../hooks/useAudio";
import {
  startCall as webrtcStartCall,
  answerCall as webrtcAnswerCall,
  hangUp as webrtcHangUp,
  listenForIncomingCalls,
  addCallLog,
  setMuted,
  setCameraOff,
} from "../utils/webrtc";

const getPairId = (a, b) => [a, b].sort().join("_");

export default function ChatPage({ onBack }) {
  const { dark, toggleDark, theme } = useTheme();

  const raw = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const me = raw ? JSON.parse(raw) : null;

  const chatWith = typeof window !== "undefined" ? localStorage.getItem("chatWith") : null;
  const isGroupChat = (chatWith || "").startsWith("group_");
  const chatId = isGroupChat ? chatWith : getPairId(me?.email || "", chatWith || "");

  const [title, setTitle] = useState("Conversation");
  const [peerProfile, setPeerProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingOthers, setTypingOthers] = useState([]);
  const [headerPresenceDoc, setHeaderPresenceDoc] = useState(null);
  const [groupLiveCount, setGroupLiveCount] = useState(0);

  // Block state
  const [blocked, setBlocked] = useState(false);
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Message context menu
  const [selectedMsg, setSelectedMsg] = useState(null);

  // WebRTC Call state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [pcState, setPcState] = useState({ pc: null, callRef: null, cleanup: null });
  const [incoming, setIncoming] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endRef = useRef(null);

  const { play: playRing, stop: stopRing } = useAudio("/ringtone.mp3", { loop: true, volume: 0.55 });

  // Attach stream to video tags
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Load chat meta
  useEffect(() => {
    const run = async () => {
      if (!chatWith) return;
      if (isGroupChat) {
        const s = await getDoc(doc(db, "chats", chatWith));
        const d = s.exists() ? s.data() : {};
        setTitle(d.groupName || "Presence Circle");
      } else {
        const s = await getDoc(doc(db, "users", chatWith));
        const d = s.exists() ? s.data() : null;
        setPeerProfile(d);
        setTitle(d?.name || chatWith.split("@")[0]);
      }
    };
    run();
  }, [chatWith, isGroupChat]);

  // Ensure chat doc exists
  useEffect(() => {
    const ensure = async () => {
      if (!me?.email || !chatWith) return;
      const ref = doc(db, "chats", chatId);
      const s = await getDoc(ref);
      if (!s.exists()) {
        await setDoc(ref, {
          type: isGroupChat ? "group" : "dm",
          participants: isGroupChat ? [] : [me.email, chatWith],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "",
        });
      }
    };
    ensure();
  }, [chatId, chatWith, isGroupChat, me?.email]);

  // Realtime Messages
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(
      query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(list);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    );
    return () => unsub();
  }, [chatId]);

  // Typing & Presence
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      const who = [];
      let activeCount = 0;
      snap.forEach((d) => {
        const v = d.data();
        if (v.typingIn === chatId && v.updatedAt) {
          const last = v.updatedAt?.toDate?.() || new Date(v.updatedAt);
          if (Date.now() - last.getTime() < 3500) who.push(d.id);
        }
        if (isGroupChat && v.active) activeCount += 1;
      });
      setTypingOthers(who.filter((e) => e !== me?.email));
      if (isGroupChat) setGroupLiveCount(activeCount);
    });
    return () => unsub();
  }, [chatId, isGroupChat, me?.email]);

  // Header presence for DM
  useEffect(() => {
    if (!isGroupChat && chatWith) {
      const unsub = onSnapshot(doc(db, "presence", chatWith), (s) => {
        setHeaderPresenceDoc(s.exists() ? s.data() : null);
      });
      return () => unsub();
    }
    setHeaderPresenceDoc(null);
  }, [chatWith, isGroupChat]);

  // Block state
  useEffect(() => {
    const run = async () => {
      if (isGroupChat || !me?.email || !chatWith) return;
      const a = await getDoc(doc(db, "users", chatWith, "blocked", me.email));
      const b = await getDoc(doc(db, "users", me.email, "blocked", chatWith));
      setBlocked(a.exists());
      setIBlockedThem(b.exists());
    };
    run();
  }, [isGroupChat, me?.email, chatWith]);

  // Incoming call listener
  useEffect(() => {
    if (!me?.email) return;
    const unsub = listenForIncomingCalls(me.email, async (data, callId) => {
      if (data?.status === "ringing" && data.callee === me.email) {
        setIncoming({ id: callId, ...data });
        try {
          playRing();
        } catch (_) {}
      }
      if (data?.status === "ended" || data?.status === "rejected") {
        stopRing();
        setIncoming(null);
        if (inCall) endCall();
      }
    });
    return () => {
      if (typeof unsub === "function") unsub();
      stopRing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.email, inCall]);

  const setTyping = async (on) => {
    if (!me?.email) return;
    await setDoc(
      doc(db, "presence", me.email),
      { typingIn: on ? chatId : "", updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const send = async () => {
    if (blocked || iBlockedThem) return;
    const text = input.trim();
    if (!text || !me?.email || !chatId) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      from: me.email,
      text,
      timestamp: serverTimestamp(),
      deleted: false,
      deletedBy: [],
    });
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    });
    setInput("");
    await setTyping(false);
  };

  const deleteForMe = async (msgId) => {
    if (!msgId || !me?.email) return;
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
      deletedBy: arrayUnion(me.email),
    });
    setSelectedMsg(null);
  };

  const deleteForEveryone = async (msgId) => {
    if (!msgId) return;
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
      deleted: true,
      text: "Message removed.",
    });
    setSelectedMsg(null);
  };

  const blockUser = async () => {
    if (!chatWith || !me?.email) return;
    await setDoc(doc(db, "users", me.email, "blocked", chatWith), {
      blockedAt: serverTimestamp(),
    });
    setIBlockedThem(true);
    setShowMenu(false);
  };

  const unblockUser = async () => {
    if (!chatWith || !me?.email) return;
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", me.email, "blocked", chatWith));
    setIBlockedThem(false);
    setShowMenu(false);
  };

  /* ---------------- WebRTC Call Handlers ---------------- */
  const beginCall = async (video = false) => {
    if (isGroupChat || !chatWith || !me?.email) return;
    try {
      setIsVideoCall(video);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });
      setLocalStream(stream);

      const { pc, callRef, cleanup } = await webrtcStartCall(
        me.email,
        chatWith,
        stream,
        (rStream) => setRemoteStream(rStream)
      );

      setPcState({ pc, callRef, cleanup });
      setInCall(true);
      await addCallLog(me.email, chatWith, "outgoing", video ? "video" : "audio");
    } catch (err) {
      console.error("Could not start call:", err);
      alert("Unable to access camera/microphone.");
    }
  };

  const acceptIncoming = async () => {
    stopRing();
    if (!incoming) return;
    try {
      const isVideo = incoming.type === "video";
      setIsVideoCall(isVideo);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      setLocalStream(stream);

      const callRef = doc(db, "calls", incoming.id);
      const { pc, cleanup } = await webrtcAnswerCall(
        callRef,
        stream,
        (rStream) => setRemoteStream(rStream)
      );

      setPcState({ pc, callRef, cleanup });
      setInCall(true);
      setIncoming(null);
      await addCallLog(incoming.caller, me.email, "incoming", isVideo ? "video" : "audio");
    } catch (err) {
      console.error("Could not accept call:", err);
      alert("Could not accept the call.");
    }
  };

  const rejectIncoming = async () => {
    stopRing();
    if (!incoming) return;
    try {
      await updateDoc(doc(db, "calls", incoming.id), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });
    } catch (_) {}
    setIncoming(null);
  };

  const endCall = async () => {
    try {
      await webrtcHangUp(pcState.pc, pcState.callRef);
      pcState.cleanup?.();
    } catch (_) {}
    try {
      localStream?.getTracks?.().forEach((t) => t.stop());
    } catch (_) {}
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setPcState({ pc: null, callRef: null, cleanup: null });
  };

  const toggleMic = () => setMicMuted((prev) => setMuted(localStream, !prev));
  const toggleCam = () => setCamOff((prev) => setCameraOff(localStream, !prev));

  const isPeerOnline = headerPresenceDoc?.active;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 h-screen overflow-hidden relative"
      style={{ background: theme.bg, color: theme.fg }}
    >
      <AmbientBackground />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        open={Boolean(incoming)}
        callerName={incoming?.caller?.split("@")[0]}
        callerEmail={incoming?.caller}
        onAccept={acceptIncoming}
        onReject={rejectIncoming}
      />

      {/* Header */}
      <header
        className="px-6 h-16 flex items-center justify-between border-b flex-shrink-0 z-30 transition-colors"
        style={{
          background: dark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.fg,
            }}
            title="Back to conversations"
          >
            <ArrowLeft size={16} />
          </button>

          <Avatar
            src={peerProfile?.img}
            name={title}
            email={!isGroupChat ? chatWith : ""}
            size={38}
            status={!isGroupChat ? (isPeerOnline ? "online" : "offline") : null}
          />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: theme.fg }}>
              {title}
            </h2>
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: theme.muted }}>
              {isGroupChat
                ? `${groupLiveCount} present in circle`
                : isPeerOnline
                ? "Active right now"
                : "Away"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isGroupChat && !inCall && !blocked && !iBlockedThem && (
            <>
              <button
                onClick={() => beginCall(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  color: theme.fg,
                }}
                title="Voice call"
              >
                <Phone size={15} />
              </button>

              <button
                onClick={() => beginCall(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  color: theme.fg,
                }}
                title="Video call"
              >
                <Video size={15} />
              </button>
            </>
          )}

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
              }}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-50 shadow-xl"
                style={{
                  background: dark ? "#111111" : "#ffffff",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <button
                  onClick={toggleDark}
                  className="w-full px-4 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  style={{ color: theme.fg }}
                >
                  {dark ? <Sun size={13} /> : <Moon size={13} />}
                  <span>{dark ? "Light mode" : "Dark mode"}</span>
                </button>

                {!isGroupChat && (
                  <>
                    <div className="my-1 border-t" style={{ borderColor: theme.border }} />
                    {!iBlockedThem ? (
                      <button
                        onClick={blockUser}
                        className="w-full px-4 py-2 text-xs flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <ShieldAlert size={13} />
                        <span>Block user</span>
                      </button>
                    ) : (
                      <button
                        onClick={unblockUser}
                        className="w-full px-4 py-2 text-xs flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <ShieldCheck size={13} />
                        <span>Unblock user</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* In-Call Floating Screen / Controls */}
      <AnimatePresence>
        {inCall && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b flex flex-col items-center justify-center gap-3 relative z-20"
            style={{
              background: dark ? "rgba(20,20,20,0.95)" : "rgba(245,245,245,0.95)",
              borderColor: theme.border,
            }}
          >
            {isVideoCall && (
              <div className="flex gap-3 w-full max-w-lg justify-center h-44">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-1/2 h-full object-cover rounded-xl border"
                  style={{ borderColor: theme.border }}
                />
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-1/2 h-full object-cover rounded-xl border"
                  style={{ borderColor: theme.border }}
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={toggleMic}
                className="p-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{
                  background: micMuted ? theme.dangerBg : theme.card,
                  color: micMuted ? theme.danger : theme.fg,
                  border: `1px solid ${micMuted ? theme.danger : theme.border}`,
                }}
              >
                {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {isVideoCall && (
                <button
                  onClick={toggleCam}
                  className="p-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{
                    background: camOff ? theme.dangerBg : theme.card,
                    color: camOff ? theme.danger : theme.fg,
                    border: `1px solid ${camOff ? theme.danger : theme.border}`,
                  }}
                >
                  {camOff ? <VideoOff size={16} /> : <Video size={16} />}
                </button>
              )}

              <button
                onClick={endCall}
                className="px-5 py-3 rounded-full text-xs font-medium flex items-center gap-1.5 text-white cursor-pointer shadow-lg"
                style={{ background: theme.danger }}
              >
                <PhoneOff size={16} />
                <span>End conversation</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Stream */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-3.5 max-w-4xl mx-auto w-full">
        {blocked && (
          <div
            className="p-3.5 rounded-xl text-center text-xs"
            style={{
              background: theme.dangerBg,
              color: theme.danger,
              border: `1px solid ${theme.danger}`,
            }}
          >
            This conversation is unavailable because you have been blocked.
          </div>
        )}

        {iBlockedThem && (
          <div
            className="p-3.5 rounded-xl text-center text-xs"
            style={{
              background: theme.card,
              color: theme.muted,
              border: `1px solid ${theme.border}`,
            }}
          >
            You blocked this user. Unblock via top-right menu to continue messaging.
          </div>
        )}

        {messages.map((m) => {
          const isDeletedForMe = (m.deletedBy || []).includes(me?.email);
          if (isDeletedForMe) return null;

          const mine = m.from === me?.email;
          const timeStr = m.timestamp?.seconds
            ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedMsg(m);
              }}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              {isGroupChat && !mine && (
                <span className="text-[10px] mb-1 px-1 font-medium" style={{ color: theme.muted }}>
                  {m.from?.split("@")[0]}
                </span>
              )}

              <div
                className="max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl relative text-xs leading-relaxed group"
                style={{
                  background: mine ? theme.accent : theme.card,
                  color: mine ? "#ffffff" : theme.fg,
                  border: mine ? "none" : `1px solid ${theme.border}`,
                  borderRadius: mine
                    ? "14px 14px 2px 14px"
                    : "14px 14px 14px 2px",
                }}
              >
                <p className={`whitespace-pre-wrap ${m.deleted ? "italic opacity-60" : ""}`}>
                  {m.text}
                </p>
                <span
                  className="text-[9px] block text-right mt-1 opacity-70"
                  style={{ color: mine ? "rgba(255,255,255,0.8)" : theme.muted }}
                >
                  {timeStr}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {typingOthers.length > 0 && (
          <div className="flex items-center gap-2 text-xs italic" style={{ color: theme.muted }}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>
              {typingOthers.length === 1
                ? `${typingOthers[0].split("@")[0]} is present…`
                : "Multiple people are typing…"}
            </span>
          </div>
        )}

        <div ref={endRef} />
      </main>

      {/* Message Context Actions Modal / Menu */}
      <AnimatePresence>
        {selectedMsg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setSelectedMsg(null)}
          >
            <div
              className="p-4 rounded-xl w-60 space-y-2 text-center"
              style={{
                background: dark ? "#111111" : "#ffffff",
                border: `1px solid ${theme.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: theme.fg }}>
                Message Options
              </p>
              <button
                onClick={() => deleteForMe(selectedMsg.id)}
                className="w-full py-2 px-3 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.fg,
                }}
              >
                <Trash2 size={13} />
                Delete for me
              </button>

              {selectedMsg.from === me?.email && (
                <button
                  onClick={() => deleteForEveryone(selectedMsg.id)}
                  className="w-full py-2 px-3 rounded-lg text-xs flex items-center gap-2 text-red-400 cursor-pointer transition-colors"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <Trash2 size={13} />
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Input Footer */}
      <footer
        className="p-4 border-t flex-shrink-0 z-30 transition-colors"
        style={{
          background: dark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: theme.border,
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3 w-full">
          <input
            type="text"
            value={input}
            disabled={blocked || iBlockedThem}
            onChange={(e) => {
              setInput(e.target.value);
              setTyping(true);
            }}
            onBlur={() => setTyping(false)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={
              blocked || iBlockedThem
                ? "Messaging disabled"
                : isGroupChat
                ? "Message circle…"
                : "Type a quiet message…"
            }
            className="flex-1 px-4 py-3 rounded-xl text-xs outline-none transition-colors"
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.fg,
              fontFamily: "'Manrope', sans-serif",
            }}
          />

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={send}
            disabled={!input.trim() || blocked || iBlockedThem}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white cursor-pointer disabled:opacity-30 transition-opacity shadow-sm"
            style={{ background: theme.accent }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
