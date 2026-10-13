import { KlimtLoading } from "@/components/klimt-loading";

export default function BookLoading() {
  return (
    <main className="detail-page" aria-busy="true" aria-label="Memuat detail buku">
      <div className="py-20 flex justify-center">
        <KlimtLoading message="Membuka detail buku…" submessage="Menyiapkan sampul dan catatan baca..." />
      </div>
    </main>
  );
}
