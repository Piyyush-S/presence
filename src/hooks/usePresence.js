// src/hooks/usePresence.js
import { useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function usePresence(email) {
  useEffect(() => {
    if (!email) return;

    let stopped = false;
    const ref = doc(db, "presence", email);

    const beat = async (active) => {
      if (stopped) return;
      await setDoc(
        ref,
        {
          active,
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );
    };

    // initial mark active
    beat(true);

    const onFocus = () => beat(true);
    const onBlur = () => beat(false);
    const interval = setInterval(() => beat(document.visibilityState === "visible"), 30_000);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onFocus);
      // best-effort mark away
      setDoc(ref, { active: false, lastActive: serverTimestamp() }, { merge: true });
    };
  }, [email]);
}
