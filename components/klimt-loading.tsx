"use client";

import type { CSSProperties } from "react";

export function KlimtLoading({
  message = "Membuka buku…",
  submessage = "Menyiapkan lembaran baca...",
  fullScreen = false,
  className = "",
  style,
}: {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`klimt-loading-container ${fullScreen ? "is-fullscreen" : ""} ${className}`}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="klimt-loading-card">
        {/* Animated Klimt Medallion */}
        <div className="klimt-medallion-halo" aria-hidden="true">
          <svg className="klimt-spinner-svg" viewBox="0 0 84 84" fill="none">
            {/* Outer dotted frieze ring */}
            <circle cx="42" cy="42" r="38" stroke="var(--gold)" strokeWidth="1.2" strokeDasharray="3 4" strokeOpacity="0.55" className="klimt-outer-ring" />
            {/* Middle decorative spiral branches */}
            <path d="M42 42 m-24 0 a 24 24 0 1 0 48 0 a 24 24 0 1 0 -48 0" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.75" />
            {/* Inner turning spiral arms */}
            <path d="M42 42c0-8 6-14 14-14s14 6 14 14-6 14-14 14" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M42 42c0 8-6 14-14 14s-14-6-14-14 6-14 14-14" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="42" cy="42" r="4.5" fill="var(--gold)" className="klimt-core-gem" />
            {/* Four decorative corner gems */}
            <circle cx="42" cy="4" r="2.2" fill="var(--gold)" />
            <circle cx="80" cy="42" r="2.2" fill="var(--gold)" />
            <circle cx="42" cy="80" r="2.2" fill="var(--gold)" />
            <circle cx="4" cy="42" r="2.2" fill="var(--gold)" />
          </svg>

          {/* Book icon in center with breathing motion */}
          <div className="klimt-book-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="klimt-book-svg">
              <path d="M4 6c3-1.5 5.5-1.5 8 0v13c-2.5-1.5-5-1.5-8 0V6z" fill="var(--gold)" fillOpacity="0.25" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M12 6c2.5-1.5 5-1.5 8 0v13c-2.5-1.5-5-1.5-8 0V6z" fill="var(--gold)" fillOpacity="0.25" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round" />
              <line x1="12" y1="6" x2="12" y2="19" stroke="var(--gold)" strokeWidth="1.6" />
            </svg>
          </div>
        </div>

        {/* Serif Typography */}
        <h3 className="klimt-loading-title">{message}</h3>
        {submessage && <p className="klimt-loading-sub">{submessage}</p>}

        {/* Shimmering Golden Progress Bar */}
        <div className="klimt-shimmer-track" aria-hidden="true">
          <div className="klimt-shimmer-bar" />
        </div>
      </div>
    </div>
  );
}
