// src/utils/webrtc.js
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// --- Small helpers ---
const callsCol = collection(db, "calls");

export function peerId(a, b) {
  return [a, b].sort().join("__");
}

export function createPeerConnection(localStream, onRemoteStream) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
    ],
  });

  // Local tracks
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }

  // Remote stream
  const remoteStream = new MediaStream();
  pc.addEventListener("track", (e) => {
    e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
    if (typeof onRemoteStream === "function") onRemoteStream(remoteStream);
  });

  return { pc, remoteStream };
}

// --- Signaling: create call (caller) ---
export async function startCall(callerEmail, calleeEmail, localStream, onRemoteStream) {
  const { pc, remoteStream } = createPeerConnection(localStream, onRemoteStream);

  // Create room doc
  const callRef = doc(callsCol, crypto.randomUUID());
  const offerCandidates = collection(callRef, "offerCandidates");
  const answerCandidates = collection(callRef, "answerCandidates");

  // ICE → offerCandidates
  pc.addEventListener("icecandidate", async (event) => {
    if (event.candidate) {
      await addDoc(offerCandidates, event.candidate.toJSON());
    }
  });

  const offerDesc = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offerDesc);

  await setDoc(callRef, {
    caller: callerEmail,
    callee: calleeEmail,
    status: "ringing", // ringing | connected | ended | rejected | missed
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    offer: {
      type: offerDesc.type,
      sdp: offerDesc.sdp,
    },
    pairKey: peerId(callerEmail, calleeEmail),
    // call history array we will append to
    history: [],
  });

  // Listen for answer
  const unsubRoom = onSnapshot(callRef, async (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDesc = new RTCSessionDescription(data.answer);
      await pc.setRemoteDescription(answerDesc);
    }
  });

  // Listen for ICE from callee
  const unsubAns = onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  const cleanup = () => {
    unsubRoom();
    unsubAns();
  };

  return { pc, callRef, remoteStream, cleanup };
}

// --- Signaling: answer (callee) ---
export async function answerCall(callId, localStream, onRemoteStream) {
  const callRef = doc(db, "calls", callId);
  const snapshot = await getDoc(callRef);
  if (!snapshot.exists()) throw new Error("Call not found");

  const data = snapshot.data();

  const { pc, remoteStream } = createPeerConnection(localStream, onRemoteStream);

  const offerCandidates = collection(callRef, "offerCandidates");
  const answerCandidates = collection(callRef, "answerCandidates");

  // ICE → answerCandidates
  pc.addEventListener("icecandidate", async (event) => {
    if (event.candidate) {
      await addDoc(answerCandidates, event.candidate.toJSON());
    }
  });

  // Apply remote offer, create answer
  const offerDesc = new RTCSessionDescription(data.offer);
  await pc.setRemoteDescription(offerDesc);
  const answerDesc = await pc.createAnswer();
  await pc.setLocalDescription(answerDesc);

  await updateDoc(callRef, {
    answer: {
      type: answerDesc.type,
      sdp: answerDesc.sdp,
    },
    status: "connected",
    updatedAt: serverTimestamp(),
  });

  // Offer ICE → add
  const unsubOffer = onSnapshot(offerCandidates, (snapshot2) => {
    snapshot2.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  const cleanup = () => unsubOffer();

  return { pc, callRef, remoteStream, cleanup };
}

// --- Listen for incoming calls for a user (global listener) ---
export function listenForIncomingCalls(myEmail, onIncoming) {
  // Any call where I'm the callee and status is 'ringing'
  return onSnapshot(
    collection(db, "calls"),
    (snap) => {
      snap.docChanges().forEach((ch) => {
        const d = ch.doc.data();
        if (d?.callee === myEmail && d?.status === "ringing") {
          onIncoming({ id: ch.doc.id, ...d });
        }
      });
    },
    (err) => console.error("listenForIncomingCalls error:", err)
  );
}

// --- Hang up ---
export async function hangUp(pc, callRef) {
  try {
    pc?.getSenders?.().forEach((s) => s.track && s.track.stop());
  } catch (_) {}
  try {
    pc?.close?.();
  } catch (_) {}
  try {
    // mark status and keep for history; do not delete immediately
    await updateDoc(callRef, {
      status: "ended",
      updatedAt: serverTimestamp(),
      "end.at": serverTimestamp(),
    });
  } catch (_) {}
}

// --- Reject ---
export async function rejectCall(callId) {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
  } catch (_) {}
}

// --- Call history append ---
export async function addCallLog(callRef, payload) {
  try {
    await updateDoc(callRef, {
      history: arrayUnion({ ...payload, at: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    });
  } catch (_) {}
}

// --- Track toggles ---
export function setMuted(stream, muted) {
  stream?.getAudioTracks?.().forEach((t) => (t.enabled = !muted));
  return muted;
}
export function setCameraOff(stream, off) {
  stream?.getVideoTracks?.().forEach((t) => (t.enabled = !off));
  return off;
}
