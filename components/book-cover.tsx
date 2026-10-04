"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { Book } from "@/data/books";
import { displayTitle, seedFromId } from "@/lib/book-utils";

export function BookCover({ book }: { book: Book }) {
  const seed = seedFromId(book.id);
  const style = {
    "--cover-color": book.coverColor,
    "--cover-accent": book.coverAccent,
  } as CSSProperties;

  return (
    <motion.div
      className="cover-art"
      style={style}
      layoutId={"book-cover-" + book.id}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg className="cover-geometry" viewBox="0 0 340 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="340" height="500" fill={book.coverColor} />
        <path
          d={seed % 2 === 0 ? "M0 0H170V500H0Z" : "M340 0H190V500H340Z"}
          fill={book.coverAccent}
          opacity="0.15"
        />
        <path
          d={seed % 3 === 0 ? "M-36 374 172 166l206 208v160H-36Z" : "M-40 88 170 298 380 88v-130H-40Z"}
          fill={book.coverAccent}
          opacity="0.36"
        />
        <circle
          cx={seed % 2 === 0 ? "228" : "112"}
          cy={seed % 3 === 0 ? "152" : "247"}
          r={seed % 2 === 0 ? "76" : "58"}
          fill={book.coverAccent}
          opacity="0.76"
        />
        <path
          d="M54 0v500M286 0v500"
          stroke="#ECE9E2"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <path
          d={seed % 2 === 0 ? "M170 0v500" : "M0 250h340"}
          stroke="#ECE9E2"
          strokeOpacity="0.26"
          strokeWidth="1"
        />
        <rect y="388" width="340" height="112" fill={book.coverColor} opacity="0.92" />
      </svg>
      <span className="cover-copy">
        <span className="cover-title" lang={book.language === "Korea" ? "ko" : undefined}>{displayTitle(book)}</span>
        <span className="cover-author">{book.author}</span>
      </span>
    </motion.div>
  );
}
