"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"ink" | "cream">("ink");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("rak_theme") as "ink" | "cream" | null;
    const initial = stored || (document.documentElement.getAttribute("data-theme") as "ink" | "cream") || "ink";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "ink" ? "cream" : "ink";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("rak_theme", next);
    } catch {
      // LocalStorage might be disabled in private browsing
    }
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={theme === "ink" ? "Ganti ke mode Cream (terang)" : "Ganti ke mode Ink (gelap)"}
      aria-label={theme === "ink" ? "Aktifkan mode Cream (terang)" : "Aktifkan mode Ink (gelap)"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "ink" ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="toggle-svg">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="currentColor" className="toggle-svg">
            <path d="M6 2a6 6 0 1 0 8 8 7 7 0 0 1-8-8z" />
          </svg>
        )}
      </span>
      <span className="theme-toggle-text">{mounted ? (theme === "ink" ? "Cream" : "Ink") : "Tema"}</span>
    </button>
  );
}
