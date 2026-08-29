// src/utils/callService.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// 🧩 Create a new call document
export async function createCall(caller, callee, offer) {
  const callId = `${caller}_${callee}_${Date.now()}`;
  const ref = doc(db, "calls", callId);

  await setDoc(ref, {
    caller,
    callee,
    offer,
    answer: null,
    status: "ringing",
    startedAt: serverTimestamp(),
  });

  return { callId, ref };
}

// 📞 Listen for incoming calls
export function listenForIncomingCalls(myEmail, callback) {
  const unsub = onSnapshot(
    doc(db, "calls", myEmail),
    (snap) => {
      if (snap.exists()) callback(snap.data(), snap.id);
    }
  );
  return unsub;
}

// ✅ Accept a call
export async function acceptCall(callId, answer) {
  const ref = doc(db, "calls", callId);
  await updateDoc(ref, { answer, status: "accepted" });
}

// ❌ Decline or end call
export async function endCall(callId) {
  const ref = doc(db, "calls", callId);
  await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
  // optionally clean up
  setTimeout(() => deleteDoc(ref), 10_000);
}
