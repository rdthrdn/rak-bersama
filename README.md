# Rak bersama

A private book archive and reading interface for a small group of friends. This project is frontend-only: the shelf, book details, reader, filters, and reader settings use local mock data; there is no backend or authentication.

## Run locally

```sh
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

## Screens

- **Rak** (`/`): status and language filters with keyboard-accessible vertical book spines.
- **Detail** (`/books/[id]`): original geometric cover art, two-sentence synopsis, reading status, progress, and member initials.
- **Reader** (`/books/[id]/read`): paginated public-domain sample text, arrow-key page turns, theme, text size, and line-height controls.

Mock book records are in `data/books.ts`. The reader preview uses the public-domain opening of H. G. Wells's *The Time Machine* as sample text.
