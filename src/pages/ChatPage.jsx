// src/pages/ChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

import IncomingCallModal from "../components/IncomingCallModal";
import useAudio from "../hooks/useAudio";

import {
  startCall as webrtcStartCall,
  answerCall as webrtcAnswerCall,
  hangUp as webrtcHangUp,
  listenForIncomingCalls,
  addCallLog,
  setMuted,
  setCameraOff,
  peerId,
} from "../utils/webrtc";

/* ---------------- Helpers ---------------- */
const getPairId = (a, b) => [a, b].sort().join("_");
const isMobile = () => (typeof window !== "undefined" ? window.innerWidth < 768 : false);

function presenceStatus(p) {
  if (p?.active) return { label: "Active now", cls: "bg-green-400" };
  if (!p?.lastActive) return { label: "Offline", cls: "bg-gray-400" };
  const last = p.lastActive?.toDate?.() || new Date(p.lastActive);
  const mins = (Date.now() - last.getTime()) / 60000;
  if (mins < 10) return { label: "Recently active", cls: "bg-yellow-400" };
  return { label: "Offline", cls: "bg-gray-400" };
}

/* ---------------- Private Bubble ---------------- */
function PrivateBubble({ me, peerEmail, defaultPos, onClose, z = 120 }) {
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingOthers, setTypingOthers] = useState([]);
  const [peerPresence, setPeerPresence] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef(null);

  const dmId = useMemo(() => getPairId(me.email, peerEmail), [me.email, peerEmail]);
  const mobile = isMobile();

  // ensure chat doc
  useEffect(() => {
    const ensure = async () => {
      const r = doc(db, "chats", dmId);
      const s = await getDoc(r);
      if (!s.exists()) {
        await setDoc(r, {
          type: "dm",
          participants: [me.email, peerEmail],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "",
        });
      }
    };
    ensure();
  }, [dmId, me.email, peerEmail]);

  // load peer
  useEffect(() => {
    const run = async () => {
      const s = await getDoc(doc(db, "users", peerEmail));
      if (s.exists()) setPeer(s.data());
    };
    run();
  }, [peerEmail]);

  // presence
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "presence", peerEmail), (snap) => {
      setPeerPresence(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [peerEmail]);

  // messages
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "chats", dmId, "messages"), orderBy("timestamp", "asc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(list);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    );
    return () => unsub();
  }, [dmId]);

  // typing
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      const who = [];
      snap.forEach((d) => {
        const v = d.data();
        if (v.typingIn === dmId && v.updatedAt) {
          const last = v.updatedAt?.toDate?.() || new Date(v.updatedAt);
          if (Date.now() - last.getTime() < 3500) who.push(d.id);
        }
      });
      setTypingOthers(who.filter((e) => e !== me.email));
    });
    return () => unsub();
  }, [dmId, me.email]);

  const setTyping = async (on) => {
    await setDoc(
      doc(db, "presence", me.email),
      { typingIn: on ? dmId : "", updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    await addDoc(collection(db, "chats", dmId, "messages"), {
      from: me.email,
      text,
      timestamp: serverTimestamp(),
      deleted: false,
      deletedBy: [],
    });
    await updateDoc(doc(db, "chats", dmId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    });
    setInput("");
    await setTyping(false);
  };

  const delForMe = async (m) => {
    await updateDoc(doc(db, "chats", dmId, "messages", m.id), {
      deletedBy: Array.from(new Set([...(m.deletedBy || []), me.email])),
    });
  };

  const delForAll = async (m) => {
    if (m.from !== me.email) return;
    await updateDoc(doc(db, "chats", dmId, "messages", m.id), {
      deleted: true,
      text: "🚫 Message deleted",
    });
  };

  const p = presenceStatus(peerPresence);

  const body = (
    <>
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/70 backdrop-blur border-b rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={peer?.img || `https://i.pravatar.cc/100?u=${peerEmail}`}
              alt=""
              className="w-6 h-6 rounded-full"
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${p.cls}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {peer?.name || peerEmail.split("@")[0]}
            </p>
            <p className="text-[10px] text-gray-400">{p.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            {minimized ? "Open" : "Minimize"}
          </button>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
          >
            Close
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 h-[calc(100vh-150px)]">
            {messages.map((m) => {
              const hidden = (m.deletedBy || []).includes(me.email);
              if (hidden) return null;
              const mine = m.from === me.email;
              const cls = mine
                ? "bg-indigo-500 text-white ml-auto rounded-l-3xl rounded-br-3xl"
                : "bg-white text-gray-700 mr-auto rounded-r-3xl rounded-bl-3xl";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[75%] p-2.5 shadow ${cls} relative`}
                >
                  <p className="text-sm">{m.text}</p>
                  {mine && !m.deleted && (
                    <div className="absolute -top-2 right-0 flex gap-1">
                      <button
                        title="Delete for me"
                        className="text-[10px] text-white/80 hover:text-white"
                        onClick={() => delForMe(m)}
                      >
                        🗑
                      </button>
                      <button
                        title="Delete for everyone"
                        className="text-[10px] text-white/80 hover:text-white"
                        onClick={() => delForAll(m)}
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {typingOthers.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] italic text-gray-400">
                {typingOthers.length === 1
                  ? `${typingOthers[0].split("@")[0]} is typing…`
                  : `${typingOthers.length} people are typing…`}
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-0 p-2.5 bg-white/80 backdrop-blur-md border-t flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setTyping(true); }}
              onBlur={() => setTyping(false)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Send a private message…"
              className="flex-1 px-3 py-2 text-sm rounded-full border border-indigo-100 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={send}
              className="px-3 py-2 text-sm rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow"
            >
              Send
            </motion.button>
          </div>
        </>
      )}
    </>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="flex flex-col flex-1 overflow-hidden rounded-t-2xl">
          {body}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95, x: defaultPos.x, y: defaultPos.y }}
      animate={{ opacity: 1, scale: 1, x: defaultPos.x, y: defaultPos.y }}
      className="fixed w-[320px] h-[420px] z-[120] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 border border-white/60"
      style={{ zIndex: z }}
    >
      <div className="flex flex-col h-full">{body}</div>
    </motion.div>
  );
}

/* ---------------- Main Chat Page ---------------- */
export default function ChatPage({ onBack }) {
  const raw = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const me = raw ? JSON.parse(raw) : null;

  const chatWith = typeof window !== "undefined" ? localStorage.getItem("chatWith") : null;
  const isGroupChat = (chatWith || "").startsWith("group_");
  const chatId = isGroupChat ? chatWith : getPairId(me?.email || "", chatWith || "");

  const [title, setTitle] = useState("Chat");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, msg: null });

  const [bubbles, setBubbles] = useState([]);
  const [typingOthers, setTypingOthers] = useState([]);
  const [headerPresenceDoc, setHeaderPresenceDoc] = useState(null);
  const [groupLiveCount, setGroupLiveCount] = useState(0);

  // block state (simple)
  const [blocked, setBlocked] = useState(false);
  const [iBlockedThem, setIBlockedThem] = useState(false);

  // --- NEW: calling state
  const [localStream, setLocalStream] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [remoteStream, setRemoteStream] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [pcState, setPcState] = useState({ pc: null, callRef: null, cleanup: null });
  const [incoming, setIncoming] = useState(null); // {id, caller, callee, ...}
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  // ringtone
  const { play: playRing, stop: stopRing } = useAudio("/ringtone.mp3", { loop: true, volume: 0.55 });

  // load chat meta
  useEffect(() => {
    const run = async () => {
      if (!chatWith) return;
      if (isGroupChat) {
        const s = await getDoc(doc(db, "chats", chatWith));
        const d = s.exists() ? s.data() : {};
        setTitle(d.groupName || "Group");
        setAvatar("https://api.iconify.design/mdi:account-group.svg?color=%238b5cf6");
      } else {
        const s = await getDoc(doc(db, "users", chatWith));
        const d = s.exists() ? s.data() : null;
        setTitle(d?.name || chatWith.split("@")[0]);
        setAvatar(d?.img || `https://i.pravatar.cc/100?u=${chatWith}`);
      }
    };
    run();
  }, [chatWith, isGroupChat]);

  // ensure doc (DM)
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

  // messages
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(
      query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(list);
      }
    );
    return () => unsub();
  }, [chatId]);

  // presence & typing
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
      setTypingOthers(who.filter((e) => e !== me.email));
      if (isGroupChat) setGroupLiveCount(activeCount);
    });
    return () => unsub();
  }, [chatId, isGroupChat, me?.email]);

  // header presence
  useEffect(() => {
    if (!isGroupChat && chatWith) {
      const unsub = onSnapshot(doc(db, "presence", chatWith), (s) => {
        setHeaderPresenceDoc(s.exists() ? s.data() : null);
      });
      return () => unsub();
    }
    setHeaderPresenceDoc(null);
    return undefined;
  }, [chatWith, isGroupChat]);

  // block state
  useEffect(() => {
    const run = async () => {
      if (isGroupChat || !me?.email || !chatWith) return;
      const a = await getDoc(doc(db, "blocks", `${chatWith}__${me.email}`));
      const b = await getDoc(doc(db, "blocks", `${me.email}__${chatWith}`));
      setBlocked(a.exists());      // they blocked me
      setIBlockedThem(b.exists()); // I blocked them
    };
    run();
  }, [isGroupChat, me?.email, chatWith]);

  const myTypingRef = doc(db, "presence", me?.email || "u");
  const setTyping = async (on) => {
    if (!me?.email) return;
    await setDoc(
      myTypingRef,
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

  const onRightClick = (e, msg) => {
    e.preventDefault();
    setMenu({ open: true, x: e.clientX, y: e.clientY, msg });
  };
  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  const deleteForMe = async () => {
    const m = menu.msg;
    if (!m) return;
    await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
      deletedBy: Array.from(new Set([...(m.deletedBy || []), me.email])),
    });
    closeMenu();
  };
  const deleteForEveryone = async () => {
    const m = menu.msg;
    if (!m || m.from !== me.email) return;
    await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
      deleted: true,
      text: "🚫 Message deleted",
    });
    closeMenu();
  };

  // whisper
  // eslint-disable-next-line no-unused-vars
  const whisperTo = async (email) => {
    closeMenu();
    if (!email || email === me.email) return;
    if (isMobile()) {
      setBubbles([{ email }]);
      return;
    }
    setBubbles((prev) => {
      if (prev.find((b) => b.email === email)) return prev;
      const off = 16 + prev.length * 24;
      return [...prev, { email, x: window.innerWidth - 360 - off, y: window.innerHeight - 460 - off }];
    });
  };

  const blockUser = async () => {
    if (isGroupChat) return;
    await setDoc(doc(db, "blocks", `${me.email}__${chatWith}`), {
      blocker: me.email,
      target: chatWith,
      createdAt: serverTimestamp(),
    });
    setIBlockedThem(true);
  };
  const unblockUser = async () => {
    if (isGroupChat) return;
    await deleteDoc(doc(db, "blocks", `${me.email}__${chatWith}`));
    setIBlockedThem(false);
  };
  const deleteChatForMe = async () => {
    const qy = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(qy, async (snap) => {
      unsub();
      const ops = snap.docs.map((d) =>
        updateDoc(doc(db, "chats", chatId, "messages", d.id), {
          deletedBy: Array.from(new Set([...(d.data().deletedBy || []), me.email])),
        })
      );
      await Promise.all(ops);
    });
  };
  const deleteChatForEveryone = async () => {
    if (isGroupChat) return;
    const qy = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(qy, async (snap) => {
      unsub();
      const ops = snap.docs.map((d) => deleteDoc(doc(db, "chats", chatId, "messages", d.id)));
      await Promise.all(ops);
      await updateDoc(doc(db, "chats", chatId), { lastMessage: "" });
    });
  };

  const headerPresence = presenceStatus(headerPresenceDoc);

  /* ---------- NEW: Incoming call listener ---------- */
  useEffect(() => {
    if (!me?.email) return;
    const unsub = listenForIncomingCalls(me.email, async (call) => {
      // Only show popup if this DM is the caller or callee in this thread
      if (!chatWith) return;
      const pair = peerId(me.email, chatWith);
      if (call.pairKey === pair && call.status === "ringing") {
        setIncoming(call);
        // play ringtone
        playRing();
      }
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.email, chatWith]);

  const beginCall = async (withVideo = false) => {
    if (isGroupChat) return alert("Calls are only for 1:1 chats (for now).");
    if (!me?.email || !chatWith) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      setLocalStream(stream);
      setMicMuted(false);
      setCamOff(!withVideo);

      const { pc, callRef, remoteStream, cleanup } = await webrtcStartCall(
        me.email,
        chatWith,
        stream,
        (remote) => setRemoteStream(remote)
      );
      setPcState({ pc, callRef, cleanup });
      setInCall(true);

      await addCallLog(callRef, { who: me.email, action: "start", video: withVideo });
    } catch (err) {
      console.error(err);
      alert("Could not start call. Check mic/camera permissions.");
    }
  };

  const acceptIncoming = async () => {
    stopRing();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      setMicMuted(false);
      setCamOff(false);

      const { pc, callRef, remoteStream, cleanup } = await webrtcAnswerCall(
        incoming.id,
        stream,
        (remote) => setRemoteStream(remote)
      );
      setPcState({ pc, callRef, cleanup });
      setInCall(true);
      setIncoming(null);

      await addCallLog(callRef, { who: me.email, action: "answer" });
    } catch (err) {
      console.error(err);
      alert("Could not accept the call.");
    }
  };

  const rejectIncoming = async () => {
    stopRing();
    setIncoming(null);
    try {
      // just mark rejected; listener in utils sets it
      await updateDoc(doc(db, "calls", incoming.id), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });
    } catch (_) {}
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="flex items-center justify-between p-5 shadow-sm bg-white/60 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={onBack}
          className="text-indigo-600 font-medium flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={avatar} alt={title} className="w-9 h-9 rounded-full object-cover border border-indigo-200" />
            {!isGroupChat && (
              <span
                title={headerPresence.label}
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${headerPresence.cls}`}
              />
            )}
          </div>
          <div className="leading-none">
            <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
            {isGroupChat ? (
              <p className="text-[11px] text-gray-500">
                {groupLiveCount > 0 ? `${groupLiveCount} active now` : "—"}
              </p>
            ) : (
              <p className="text-[11px] text-gray-500">{headerPresence.label}</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {!isGroupChat ? (
          <div className="flex items-center gap-2">
            {!iBlockedThem ? (
              <button onClick={blockUser} className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full hover:bg-red-100">
                Block
              </button>
            ) : (
              <button onClick={unblockUser} className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                Unblock
              </button>
            )}
            <button onClick={deleteChatForMe} className="px-3 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200">
              Delete chat (me)
            </button>
            <button onClick={deleteChatForEveryone} className="px-3 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200">
              Delete chat (all)
            </button>
          </div>
        ) : <div className="w-14" />}
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {blocked && (
          <div className="text-center text-sm text-red-500">
            You cannot message this user. They have blocked you.
          </div>
        )}
        {iBlockedThem && (
          <div className="text-center text-sm text-orange-500">
            You blocked this user. Unblock to send messages.
          </div>
        )}

        {messages.map((m) => {
          const hiddenForMe = (m.deletedBy || []).includes(me.email);
          if (hiddenForMe) return null;
          const mine = m.from === me.email;
          const cls = mine
            ? "bg-indigo-500 text-white ml-auto rounded-l-3xl rounded-br-3xl"
            : "bg-white text-gray-700 mr-auto rounded-r-3xl rounded-bl-3xl";
        return (
            <motion.div
              key={m.id}
              onContextMenu={(e) => onRightClick(e, m)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[75%] p-3 shadow ${cls} relative`}
            >
              {isGroupChat && !mine && (
                <p className="text-[11px] font-medium text-indigo-700 mb-0.5">
                  {m.from.split("@")[0]}
                </p>
              )}
              <p className="text-sm">{m.text}</p>
              <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                {m.timestamp?.toDate
                  ? m.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </motion.div>
          );
        })}

        {/* typing */}
        {typingOthers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[11px] italic text-gray-400">
              {typingOthers.length === 1
                ? `${typingOthers[0].split("@")[0]} is typing…`
                : `${typingOthers.length} people are typing…`}
            </p>
          </motion.div>
        )}
      </main>

      {/* Input + Call buttons */}
      <footer className="p-4 bg-white/60 backdrop-blur-md flex items-center gap-3 border-t flex-wrap">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTyping(true);
          }}
          onBlur={() => setTyping(false)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={isGroupChat ? "Message the group…" : "Type a message…"}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-full border border-indigo-100 focus:ring-2 focus:ring-indigo-400 outline-none"
          disabled={blocked || iBlockedThem}
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={send}
          disabled={blocked || iBlockedThem}
          className={`px-5 py-2 rounded-full text-white shadow ${
            blocked || iBlockedThem ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          Send
        </motion.button>

        {!isGroupChat && !inCall && !blocked && !iBlockedThem && (
          <>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => beginCall(false)}
              className="px-3 py-2 rounded-full bg-green-500 text-white text-sm hover:bg-green-600"
            >
              🎧 Voice
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => beginCall(true)}
              className="px-3 py-2 rounded-full bg-blue-500 text-white text-sm hover:bg-blue-600"
            >
              🎥 Video
            </motion.button>
          </>
        )}
        {inCall && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`px-3 py-2 rounded-full text-white text-sm ${micMuted ? "bg-gray-500" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {micMuted ? "🎙️ Unmute" : "🔇 Mute"}
            </button>
            <button
              onClick={toggleCam}
              className={`px-3 py-2 rounded-full text-white text-sm ${camOff ? "bg-gray-500" : "bg-sky-600 hover:bg-sky-700"}`}
            >
              {camOff ? "📷 Cam On" : "📷 Cam Off"}
            </button>
            <button
              onClick={endCall}
              className="px-3 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600"
            >
              🔴 End
            </button>
          </div>
        )}
      </footer>

      {/* Popup menu */}
      <AnimatePresence>
        {menu.open && menu.msg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: menu.y, left: menu.x }}
            className="fixed z-[140] bg-white/90 backdrop-blur-md rounded-xl shadow-xl border p-2 w-48"
            onMouseLeave={closeMenu}
          >
            <button
              onClick={() => {
                setInput((v) => `${v}${isGroupChat ? `@${menu.msg.from.split("@")[0]} ` : ""}`);
                closeMenu();
              }}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              💬 Reply
            </button>
            {isGroupChat && menu.msg.from !== me.email && (
              <button
                onClick={() => {
                  closeMenu();
                  // open whisper bubble
                  setBubbles((prev) => {
                    if (prev.find((b) => b.email === menu.msg.from)) return prev;
                    const off = 16 + prev.length * 24;
                    return [...prev, { email: menu.msg.from, x: window.innerWidth - 360 - off, y: window.innerHeight - 460 - off }];
                  });
                }}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-indigo-50"
              >
                💌 Message privately
              </button>
            )}
            <button
              onClick={deleteForMe}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              🗑 Delete for me
            </button>
            {menu.msg.from === me.email && (
              <button
                onClick={deleteForEveryone}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                ❌ Delete for everyone
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating private bubbles */}
      {bubbles.map((b, i) => (
        <PrivateBubble
          key={b.email}
          me={me}
          peerEmail={b.email}
          defaultPos={{
            x: typeof b.x === "number" ? b.x : window.innerWidth - 360 - 16 - i * 24,
            y: typeof b.y === "number" ? b.y : window.innerHeight - 460 - 16 - i * 24,
          }}
          onClose={() => setBubbles((prev) => prev.filter((x) => x.email !== b.email))}
          z={150 + i}
        />
      ))}

      {/* Incoming call modal */}
      <IncomingCallModal
        open={!!incoming}
        callerName={incoming?.caller?.split("@")[0]}
        onAccept={acceptIncoming}
        onReject={rejectIncoming}
      />

      {/* In-call overlay (shows videos if in call) */}
{/* 🔴 In-call overlay with fixed video + controls */}
{inCall && (
  <div className="fixed inset-0 bg-[#1c1c1c] flex flex-col items-center justify-center z-[150] p-4 text-white">
    {/* Video container */}
    <div className="flex flex-wrap md:flex-nowrap gap-6 justify-center items-center mb-6">
      {/* Local video */}
      <video
        autoPlay
        playsInline
        muted
        ref={(el) => {
          if (el && localStream && el.srcObject !== localStream) el.srcObject = localStream;
        }}
        className="w-64 h-44 md:w-[380px] md:h-[260px] rounded-lg border-2 border-gray-300 shadow-lg bg-black object-cover"
      />
      {/* Remote video */}
      <video
        autoPlay
        playsInline
        ref={(el) => {
          if (el && remoteStream && el.srcObject !== remoteStream) el.srcObject = remoteStream;
        }}
        className="w-64 h-44 md:w-[380px] md:h-[260px] rounded-lg border-2 border-gray-300 shadow-lg bg-black object-cover"
      />
    </div>

    {/* Control buttons */}
    <div className="flex items-center gap-4">
      <button
        onClick={() => {
          localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        }}
        className="px-5 py-2 bg-green-600 rounded-full shadow hover:bg-green-700 flex items-center gap-2 transition"
      >
        🔇 Mute
      </button>

      <button
        onClick={() => {
          localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        }}
        className="px-5 py-2 bg-gray-600 rounded-full shadow hover:bg-gray-700 flex items-center gap-2 transition"
      >
        📷 Cam On
      </button>

      <button
        onClick={endCall}
        className="px-5 py-2 bg-red-600 rounded-full shadow hover:bg-red-700 flex items-center gap-2 transition"
      >
        🔴 End Call
      </button>
    </div>
  </div>
)}

    </div>
  );
}
