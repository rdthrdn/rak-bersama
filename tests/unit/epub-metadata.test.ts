import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { extractEpubMetadata } from "@/lib/epub-metadata";

async function makeEpub(options: { withMetadata?: boolean } = {}) {
  const zip = new JSZip();
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml" /></rootfiles></container>`,
  );
  zip.file(
    "OEBPS/package.opf",
    options.withMetadata === false
      ? `<package><metadata/><manifest/><spine/></package>`
      : `<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><dc:title>Novel Uji</dc:title><dc:creator>Penulis Uji</dc:creator><dc:language>id</dc:language><dc:description>Catatan singkat.</dc:description></metadata><manifest><item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image" /></manifest><spine /></package>`,
  );
  if (options.withMetadata !== false) {
    zip.file("OEBPS/images/cover.png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return zip.generateAsync({ type: "uint8array" });
}

describe("extractEpubMetadata", () => {
  it("extracts the package fields and resolves a nested cover image", async () => {
    const epub = await makeEpub();
    const metadata = await extractEpubMetadata(epub);

    expect(metadata).toMatchObject({
      title: "Novel Uji",
      author: "Penulis Uji",
      language: "id",
      description: "Catatan singkat.",
    });
    expect(metadata.cover).toBeInstanceOf(Blob);
    expect(metadata.cover?.type).toBe("image/png");
  });

  it("returns empty optional fields when the package has no metadata", async () => {
    const epub = await makeEpub({ withMetadata: false });
    const metadata = await extractEpubMetadata(epub);

    expect(metadata).toEqual({ title: "", author: "", language: "", description: "", cover: null });
  });

  it("rejects a ZIP that does not contain an EPUB container", async () => {
    const zip = new JSZip();
    zip.file("not-an-epub.txt", "not an EPUB");

    await expect(extractEpubMetadata(await zip.generateAsync({ type: "uint8array" })))
      .rejects.toThrow("EPUB tidak memiliki META-INF/container.xml");
  });
});
