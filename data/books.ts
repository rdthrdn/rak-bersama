export type ReadingStatus = "Reading" | "Finished" | "Dropped" | "Paused";
export type BookLanguage = "Inggris" | "Indonesia" | "Korea";

export type Book = {
  id: string;
  title: string;
  displayTitle?: string;
  author: string;
  year: number;
  pages?: number;
  genre: string;
  language: BookLanguage;
  status: ReadingStatus;
  progress: number;
  synopsis: string;
  accentWord: string;
  spineColor: string;
  spineInk: string;
  coverColor: string;
  coverAccent: string;
  members: string[];
};

export const books: Book[] = [
  {
    id: "hitchhikers-guide",
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    year: 1979,
    pages: 216,
    genre: "Fiksi ilmiah",
    language: "Inggris",
    status: "Reading",
    progress: 42,
    synopsis:
      "Arthur Dent meninggalkan Bumi beberapa saat sebelum planet itu dihancurkan untuk membuka jalur antargalaksi. Bersama Ford Prefect, ia belajar bahwa perjalanan semesta sering dimulai dengan handuk dan rasa ingin tahu.",
    accentWord: "Galaxy",
    spineColor: "#424633",
    spineInk: "#ECE9E2",
    coverColor: "#424633",
    coverAccent: "#A38D5D",
    members: ["AN", "DP", "MK"],
  },
  {
    id: "mans-search-for-meaning",
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    year: 1946,
    genre: "Memoar",
    language: "Inggris",
    status: "Finished",
    progress: 100,
    synopsis:
      "Viktor Frankl menulis tentang pengalaman hidup di kamp konsentrasi dan cara manusia mencari makna di tengah penderitaan. Kenangannya menjadi dasar renungan tentang kebebasan batin dan tanggung jawab.",
    accentWord: "Meaning",
    spineColor: "#A38D5D",
    spineInk: "#1D1B16",
    coverColor: "#513936",
    coverAccent: "#A38D5D",
    members: ["AN", "SR"],
  },
  {
    id: "what-i-talk-about-running",
    title: "What I Talk About When I Talk About Running",
    author: "Haruki Murakami",
    year: 2007,
    genre: "Esai",
    language: "Inggris",
    status: "Reading",
    progress: 28,
    synopsis:
      "Murakami merangkai catatan tentang lari, menulis, dan kebiasaan yang membentuk hari-harinya. Setiap jarak yang ditempuh menjadi cara sederhana untuk mengamati daya tahan dan perubahan diri.",
    accentWord: "Running",
    spineColor: "#333231",
    spineInk: "#ECE9E2",
    coverColor: "#333231",
    coverAccent: "#776C58",
    members: ["MK", "RT"],
  },
  {
    id: "when-breath-becomes-air",
    title: "When Breath Becomes Air",
    author: "Paul Kalanithi",
    year: 2016,
    genre: "Memoar",
    language: "Inggris",
    status: "Finished",
    progress: 100,
    synopsis:
      "Seorang ahli bedah saraf menghadapi diagnosis kanker saat hidupnya sedang berada di persimpangan penting. Ia menelusuri kembali arti pekerjaan, keluarga, dan waktu yang masih tersisa.",
    accentWord: "Breath",
    spineColor: "#333231",
    spineInk: "#ECE9E2",
    coverColor: "#424633",
    coverAccent: "#A38D5D",
    members: ["DP", "SR", "RT"],
  },
  {
    id: "chess-story",
    title: "Chess Story",
    author: "Stefan Zweig",
    year: 1942,
    genre: "Fiksi",
    language: "Inggris",
    status: "Paused",
    progress: 52,
    synopsis:
      "Dalam pelayaran melintasi Atlantik, seorang juara catur bertemu lawan yang tidak terduga. Sebuah buku yang ditemukan diam-diam membuka kisah tentang kesendirian dan pikiran yang terus bergerak.",
    accentWord: "Chess",
    spineColor: "#513936",
    spineInk: "#ECE9E2",
    coverColor: "#513936",
    coverAccent: "#A38D5D",
    members: ["AN"],
  },
  {
    id: "silent-patient",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    year: 2019,
    genre: "Misteri",
    language: "Inggris",
    status: "Dropped",
    progress: 17,
    synopsis:
      "Setelah sebuah peristiwa mengejutkan, Alicia Berenson berhenti berbicara dan hanya meninggalkan sebuah lukisan. Seorang terapis berusaha memahami kebisuannya, sambil mempertanyakan jarak antara kesaksian dan kebenaran.",
    accentWord: "Silent",
    spineColor: "#2A2924",
    spineInk: "#ECE9E2",
    coverColor: "#333231",
    coverAccent: "#776C58",
    members: ["MK"],
  },
  {
    id: "old-man-and-sea",
    title: "The Old Man and the Sea",
    displayTitle: "노인과 바다",
    author: "Ernest Hemingway",
    year: 1952,
    genre: "Fiksi",
    language: "Korea",
    status: "Finished",
    progress: 100,
    synopsis:
      "Seorang nelayan tua berlayar jauh dari pantai Kuba dan bertaruh pada ketekunannya sendiri. Pertarungannya di laut menjadi kisah sederhana tentang keberanian, kesunyian, dan harga sebuah perjuangan.",
    accentWord: "바다",
    spineColor: "#424633",
    spineInk: "#ECE9E2",
    coverColor: "#424633",
    coverAccent: "#A38D5D",
    members: ["DP", "RT"],
  },
  {
    id: "tteokbokki",
    title: "죽고 싶지만 떡볶이는 먹고 싶어",
    author: "Baek Sehee",
    year: 2018,
    genre: "Memoar",
    language: "Korea",
    status: "Paused",
    progress: 36,
    synopsis:
      "Melalui percakapan dengan psikiaternya, Baek Sehee mencatat pikiran yang sering sulit ia ucapkan kepada orang lain. Catatan itu bergerak pelan antara keraguan diri, kebiasaan sehari-hari, dan keinginan untuk merasa lebih baik.",
    accentWord: "떡볶이는",
    spineColor: "#513936",
    spineInk: "#ECE9E2",
    coverColor: "#513936",
    coverAccent: "#A38D5D",
    members: ["SR"],
  },
  {
    id: "little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    year: 1943,
    genre: "Fabel",
    language: "Inggris",
    status: "Reading",
    progress: 65,
    synopsis:
      "Seorang pilot yang terdampar di gurun bertemu anak kecil dari sebuah asteroid jauh. Percakapan mereka mengajak pembaca melihat kembali persahabatan, kehilangan, dan hal-hal yang luput dari pandangan.",
    accentWord: "Little",
    spineColor: "#A38D5D",
    spineInk: "#1D1B16",
    coverColor: "#333231",
    coverAccent: "#A38D5D",
    members: ["AN", "MK", "SR"],
  },
  {
    id: "laut-bercerita",
    title: "Laut Bercerita",
    author: "Leila S. Chudori",
    year: 2017,
    genre: "Novel sejarah",
    language: "Indonesia",
    status: "Reading",
    progress: 58,
    synopsis:
      "Biru Laut dan kawan-kawannya bergerak di tengah pergolakan politik Indonesia pada akhir abad ke-20. Bertahun-tahun kemudian, keluarganya masih mencari kabar dan cara untuk menjaga ingatan tetap hidup.",
    accentWord: "Laut",
    spineColor: "#333231",
    spineInk: "#ECE9E2",
    coverColor: "#424633",
    coverAccent: "#776C58",
    members: ["DP", "RT"],
  },
];

export const statusLabels: Record<ReadingStatus | "All", string> = {
  All: "Semua",
  Finished: "Selesai",
  Reading: "Sedang dibaca",
  Dropped: "Dihentikan",
  Paused: "Dijeda",
};
