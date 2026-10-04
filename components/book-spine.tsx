"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { BookCard } from "@/lib/database.types";
import { seedFromId, statusText } from "@/lib/book-utils";

const patterns = ["mosaic", "circles", "flowers", "strips", "triangles", "tree"];
const colors = ["#424633", "#513936", "#333231", "#776C58", "#6C5B3E"];

export function BookSpine({ book, index }: { book: BookCard; index: number }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = seedFromId(book.id);
  const style = {
    "--spine-color": colors[seed % colors.length],
    "--spine-height": `${276 + ((seed + index * 3) % 7) * 19}px`,
    "--spine-width": `${92 + ((seed + index) % 4) * 9}px`,
    "--tilt": `${(seed % 9) - 4}deg`,
    "--pattern-shift": `${seed % 6}`,
  } as CSSProperties;

  return (
    <motion.button
      type="button"
      className={`book-spine pattern-${patterns[seed % patterns.length]}`}
      style={style}
      aria-label={`${book.title} — ${book.author}, buka detail`}
      layoutId={`book-cover-${book.id}`}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.35, delay: reduceMotion ? 0 : index * 0.035 }, y: { duration: 0.52, delay: reduceMotion ? 0 : index * 0.035, ease: [0.22, 1, 0.36, 1] }, layout: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }}
      whileHover={reduceMotion ? undefined : { y: -7, rotate: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      onClick={() => router.push(`/books/${book.id}`)}
    >
      <span className="spine-pattern" aria-hidden="true" />
      <span className="spine-label">
        <span className="spine-title">{book.title}</span>
        <span className="spine-author">{book.author}</span>
      </span>
      <span className={`spine-status status-${book.status}`} title={statusText(book.status)} aria-label={statusText(book.status)} />
    </motion.button>
  );
}
