import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { detectBookFormat, validateBookBytes } from "@/lib/file-validation";

async function makeEpub(includeContainer = true) {
  const zip = new JSZip();
  if (includeContainer) {
    zip.file("META-INF/container.xml", '<container><rootfiles><rootfile full-path="OEBPS/book.opf" /></rootfiles></container>');
    zip.file("OEBPS/book.opf", '<package><metadata><title>Contoh</title></metadata></package>');
  } else {
    zip.file("other.txt", "This is a ZIP file, not an EPUB package.");
  }
  return zip.generateAsync({ type: "uint8array" });
}

describe("berkas buku", () => {
  it("mendeteksi format dari tanda tangan berkas", () => {
    expect(detectBookFormat(new TextEncoder().encode("%PDF-1.7"))).toBe("pdf");
    expect(detectBookFormat(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe("epub");
    expect(detectBookFormat(new TextEncoder().encode("buku.pdf"))).toBeNull();
  });

  it("menerima EPUB yang berisi container dan OPF", async () => {
    const bytes = await makeEpub();
    await expect(validateBookBytes(bytes, "epub")).resolves.toBeUndefined();
  });

  it("menolak ZIP tanpa container EPUB", async () => {
    const bytes = await makeEpub(false);
    await expect(validateBookBytes(bytes, "epub")).rejects.toThrow("container.xml");
  });

  it("memeriksa tanda tangan PDF di server", async () => {
    await expect(validateBookBytes(new TextEncoder().encode("%PDF-1.7"), "pdf")).resolves.toBeUndefined();
    await expect(validateBookBytes(new TextEncoder().encode("not a pdf"), "pdf")).rejects.toThrow("tanda tangan PDF");
  });
});
