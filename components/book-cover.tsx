"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { BookCard } from "@/lib/database.types";
import { seedFromId } from "@/lib/book-utils";
import { BookTitle } from "@/components/book-title";

const tones = ["#424633", "#513936", "#333231", "#776C58", "#6C5B3E"];

export function BookCover({ book }: { book: BookCard }) {
  const [imageFailed, setImageFailed] = useState(false);
  const seed = seedFromId(book.id);
  const tone = tones[seed % tones.length];
  const accent = seed % 3 === 0 ? "#A38D5D" : seed % 3 === 1 ? "#9F9B90" : "#776C58";
  const style = { "--cover-color": tone, "--cover-accent": accent } as CSSProperties;

  return (
    <motion.div className="cover-art" style={style} layoutId={`book-cover-${book.id}`} transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}>
      {book.cover_url && !imageFailed ? (
        <img className="cover-photo" src={book.cover_url} alt={`Sampul ${book.title}`} onError={() => setImageFailed(true)} />
      ) : (
        <svg className="cover-geometry" viewBox="0 0 340 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id={`tile-${book.id}`} width="56" height="56" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill={accent} />
              <rect x="28" y="28" width="28" height="28" fill={accent} />
              <circle cx="42" cy="14" r="6" fill="#8A3A32" />
              <circle cx="14" cy="42" r="5" fill="#2F5B45" />
              <path d="M28 0v56M0 28h56" stroke="#ECE9E2" strokeOpacity=".26" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="340" height="500" fill={tone} />
          <rect width="340" height="360" fill={`url(#tile-${book.id})`} opacity=".56" />
          <circle cx={seed % 2 ? 230 : 112} cy={seed % 3 ? 148 : 232} r="82" fill="none" stroke="#A38D5D" strokeWidth="14" />
          <circle cx={seed % 2 ? 230 : 112} cy={seed % 3 ? 148 : 232} r="56" fill="none" stroke="#ECE9E2" strokeOpacity=".52" strokeWidth="1.5" />
          <rect y="360" width="340" height="140" fill="#2A2924" />
        </svg>
      )}
      <div className="cover-copy">
        <span className="cover-title"><BookTitle book={book} /></span>
        <span className="cover-author">{book.author}</span>
      </div>
    </motion.div>
  );
}
