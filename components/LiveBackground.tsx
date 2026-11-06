"use client";
import { useEffect } from "react";

export default function LiveBackground() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", localStorage.getItem("kfe-theme") === "dark");
    root.classList.toggle("reduced-motion", localStorage.getItem("kannadamitra-reduce-motion") === "true");
    root.classList.toggle("large-text", localStorage.getItem("kannadamitra-large-text") === "true");
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const x = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      const y = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
      root.style.setProperty("--wall-x", `${x}`);
      root.style.setProperty("--wall-y", `${y}`);
      root.style.setProperty("--wall-rx", `${-y * 4}deg`);
      root.style.setProperty("--wall-ry", `${x * 7}deg`);
      root.style.setProperty("--wall-shift-x", `${-x * 12}px`);
      root.style.setProperty("--wall-shift-y", `${-y * 9}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return <div className="live-wallpaper" aria-hidden="true"><div className="wall-depth"><span className="wall-character" lang="kn">ಅ</span></div></div>;
}
