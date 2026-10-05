"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { BookCard } from "@/lib/database.types";
import { seedFromId } from "@/lib/book-utils";
import { BookTitle } from "@/components/book-title";
import { KlimtPattern, type KlimtMotif } from "@/components/patterns/klimt-pattern";

const tones = ["#424633", "#513936", "#333231", "#776C58", "#6C5B3E"];
const motifs: KlimtMotif[] = ["mosaic", "medallion", "flowers", "stripes", "tiles", "tree"];

export function BookCover({ book }: { book: BookCard }) {
  const [imageFailed, setImageFailed] = useState(false);
  const seed = seedFromId(book.id);
  const tone = tones[seed % tones.length];
  const accent = seed % 3 === 0 ? "#A38D5D" : seed % 3 === 1 ? "#9F9B90" : "#776C58";
  const style = { "--cover-color": tone, "--cover-accent": accent } as CSSProperties;
  const motif = motifs[seed % motifs.length];

  return (
    <motion.div className="cover-art" style={style} layoutId={`book-cover-${book.id}`} transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}>
      {book.cover_url && !imageFailed ? (
        <img className="cover-photo" src={book.cover_url} alt={`Sampul ${book.title}`} onError={() => setImageFailed(true)} />
      ) : (
        <KlimtPattern className="cover-geometry" motif={motif} id={book.id} seed={seed} base={tone} gold={accent} />
      )}
      <div className="cover-copy">
        <span className="cover-title"><BookTitle book={book} /></span>
        <span className="cover-author">{book.author}</span>
      </div>
    </motion.div>
  );
}
