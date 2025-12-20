// src/hooks/useAudio.js
import { useEffect, useRef } from "react";

export default function useAudio(src, { loop = true, volume = 0.6 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    ref.current = audio;
    return () => {
      try {
        audio.pause();
        audio.src = "";
      } catch (_) {}
    };
  }, [src, loop, volume]);

  const play = async () => {
    try {
      await ref.current?.play();
    } catch (_) {}
  };
  const stop = () => {
    try {
      ref.current?.pause();
      ref.current.currentTime = 0;
    } catch (_) {}
  };

  return { play, stop };
}
