"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Book } from "@/data/books";
import { displayTitle, seedFromId } from "@/lib/book-utils";

export function BookSpine({ book, index }: { book: Book; index: number }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = seedFromId(book.id);
  const style = {
    "--book-color": book.spineColor,
    "--book-ink": book.spineInk,
    "--spine-height": 302 + ((seed + index) % 6) * 18 + "px",
    "--spine-width": 57 + ((seed + index) % 4) * 6 + "px",
    "--tilt": ((seed % 7) - 3) + "deg",
  } as CSSProperties;

  return (
    <motion.button
      type="button"
      className="book-spine"
      style={style}
      aria-label={displayTitle(book) + " — " + book.author + ", buka detail"}
      layoutId={"book-cover-" + book.id}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { duration: 0.35, delay: reduceMotion ? 0 : index * 0.04 },
        y: { duration: 0.48, delay: reduceMotion ? 0 : index * 0.04, ease: [0.22, 1, 0.36, 1] },
        layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      }}
      whileHover={reduceMotion ? undefined : { y: -8, rotate: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      onClick={() => router.push("/books/" + book.id)}
    >
      <span className="spine-title" lang={book.language === "Korea" ? "ko" : undefined}>
        {displayTitle(book)}
      </span>
      <span className="spine-rule" aria-hidden="true" />
      <span className="spine-author">{book.author}</span>
    </motion.button>
  );
}
