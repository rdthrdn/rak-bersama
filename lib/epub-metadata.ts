import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { assertSafeArchive, epubPackagePath } from "@/lib/file-validation";

export type EpubMetadata = {
  title: string;
  author: string;
  language: string;
  description: string;
  cover: Blob | null;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  textNodeName: "#text",
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return text(value[0]);
  if (value && typeof value === "object" && "#text" in value) return text((value as { "#text": unknown })["#text"]);
  return "";
}

function attr(value: unknown, name: string) {
  if (!value || typeof value !== "object") return "";
  const item = (value as Record<string, unknown>)[`@_${name}`];
  return typeof item === "string" ? item.trim() : "";
}

function pathInArchive(opfPath: string, href: string) {
  const base = opfPath.split("/").slice(0, -1);
  const parts = [...base, ...decodeURIComponent(href).replaceAll("\\", "/").split("/")];
  const output: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") output.pop();
    else output.push(part);
  }
  return output.join("/");
}

function imageType(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export async function extractEpubMetadata(file: File | ArrayBuffer | Uint8Array): Promise<EpubMetadata> {
  const data = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;
  const zip = await JSZip.loadAsync(data);
  assertSafeArchive(zip);
  const rootfile = await epubPackagePath(zip);

  const packageFile = zip.file(rootfile);
  if (!packageFile) throw new Error("Paket EPUB tidak ditemukan.");
  const opfSize = (packageFile as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  if (opfSize > 2 * 1024 * 1024) throw new Error("Metadata EPUB terlalu besar untuk dibaca.");
  const parsedPackage = parser.parse(await packageFile.async("string")) as Record<string, unknown>;
  const pkg = (parsedPackage.package ?? parsedPackage) as Record<string, unknown>;
  const metadata = (pkg.metadata ?? {}) as Record<string, unknown>;
  const manifest = (pkg.manifest ?? {}) as Record<string, unknown>;
  const title = text(metadata.title);
  const author = text(metadata.creator);
  const language = text(metadata.language);
  const description = text(metadata.description);
  const items = asArray(manifest.item as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const metas = asArray(metadata.meta as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const coverId = metas.find((item) => attr(item, "name") === "cover")
    ? attr(metas.find((item) => attr(item, "name") === "cover"), "content")
    : "";
  const coverItem = items.find((item) =>
    (attr(item, "id") && attr(item, "id") === coverId) ||
    attr(item, "properties").split(/\s+/).includes("cover-image"),
  );
  let cover: Blob | null = null;
  if (coverItem) {
    const href = attr(coverItem, "href");
    if (href && !/^(?:[a-z]+:|\/\/)/i.test(href)) {
      const path = pathInArchive(rootfile, href);
      const image = zip.file(path);
      if (image) cover = await image.async("blob").then((blob) => new Blob([blob], { type: imageType(path) }));
    }
  }

  return { title, author, language, description, cover };
}
