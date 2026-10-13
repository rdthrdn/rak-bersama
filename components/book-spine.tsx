"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { BookCard } from "@/lib/database.types";
import { seedFromId, statusText } from "@/lib/book-utils";
import { KlimtPattern, type KlimtMotif } from "@/components/patterns/klimt-pattern";

const palettes: Array<{ motif: KlimtMotif; base: string; gold: string; width: number; height: number; tilt: number }> = [
  { motif: "mosaic", base: "#BFA058", gold: "#EAD086", width: 114, height: 348, tilt: 0 },
  { motif: "flowers", base: "#163527", gold: "#D8BC74", width: 92, height: 334, tilt: 0 },
  { motif: "crimson", base: "#5E2520", gold: "#DEBF75", width: 86, height: 322, tilt: -3.8 },
  { motif: "spirals", base: "#3A3C3A", gold: "#D6B770", width: 98, height: 366, tilt: 0 },
  { motif: "foliage", base: "#192B45", gold: "#E0C077", width: 110, height: 352, tilt: 0 },
  { motif: "medallion", base: "#4B4430", gold: "#D5B872", width: 88, height: 320, tilt: 0 },
];

export function BookSpine({ book, index }: { book: BookCard; index: number }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = seedFromId(book.id);
  const palette = palettes[(seed + index) % palettes.length];
  const style = {
    "--spine-color": palette.base,
    "--spine-height": `${palette.height}px`,
    "--spine-width": `${palette.width}px`,
    "--tilt": `${palette.tilt}deg`,
  } as CSSProperties;

  return (
    <motion.button
      type="button"
      className="book-spine"
      data-pattern={palette.motif}
      style={style}
      aria-label={`${book.title} — ${book.author}, buka detail`}
      layoutId={`book-cover-${book.id}`}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.35, delay: reduceMotion ? 0 : index * 0.035 }, y: { duration: 0.52, delay: reduceMotion ? 0 : index * 0.035, ease: [0.22, 1, 0.36, 1] }, layout: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }}
      whileHover={reduceMotion ? undefined : { y: -8, rotate: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      onClick={() => router.push(`/books/${book.id}`)}
    >
      <span className="spine-top-cap" aria-hidden="true" />
      <span className="spine-pattern"><KlimtPattern motif={palette.motif} id={book.id} seed={seed} base={palette.base} gold={palette.gold} /></span>
      <span className="spine-lighting" aria-hidden="true" />
      <span className="spine-label">
        <span className="spine-title">{book.title}</span>
        <span className="spine-divider" aria-hidden="true" />
        <span className="spine-author">{book.author}</span>
      </span>
      <span className={`spine-badge status-${book.status}`} title={statusText(book.status)} aria-label={statusText(book.status)}>
        {book.status === "finished" ? (
          <svg className="badge-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        ) : (
          <svg className="badge-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 3.5C6.5 2.5 4.5 2.2 2.5 2.5v9.2c1.8-.2 3.6.1 5 1 1.4-.9 3.2-1.2 5-1V2.5c-2-.3-4 0-5.5 1zm-.7 8.2c-1.3-.7-3-1-4.8-.8V4.1c1.5-.2 3 .1 4.3.9v6.7zm6.2-.8c-1.8-.2-3.5.1-4.8.8V4.9c1.3-.8 2.8-1.1 4.3-.9v6.7z" />
          </svg>
        )}
      </span>
    </motion.button>
  );
}
