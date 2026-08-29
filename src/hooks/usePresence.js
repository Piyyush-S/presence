import { useEffect, useRef } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function usePresence(email) {
  const hasRun = useRef(false);

  useEffect(() => {
    // ❌ No email → do nothing
    if (!email) return;

    // ❌ Prevent infinite re-runs
    if (hasRun.current) return;
    hasRun.current = true;

    const ref = doc(db, "presence", email);

    const setOnline = async () => {
      try {
        await setDoc(
          ref,
          {
            online: true,
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Presence skipped (offline or blocked)");
      }
    };

    const setOffline = async () => {
      try {
        await setDoc(
          ref,
          {
            online: false,
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
    };

    setOnline();
    window.addEventListener("beforeunload", setOffline);

    return () => {
      setOffline();
      window.removeEventListener("beforeunload", setOffline);
    };
  }, [email]);
}
