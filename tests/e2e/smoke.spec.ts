import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const memberAState = process.env.PLAYWRIGHT_MEMBER_A_STATE || path.resolve("tests/e2e/.auth/member-a.json");
const memberBState = process.env.PLAYWRIGHT_MEMBER_B_STATE || path.resolve("tests/e2e/.auth/member-b.json");
const fixtureDirectory = path.resolve("tests/fixtures");
const screenshotDirectory = path.resolve("docs/screenshots");
const captureScreenshots = process.env.PLAYWRIGHT_CAPTURE_SCREENSHOTS === "1";

function assertLocalTarget() {
  const hostname = new URL(baseURL).hostname;
  if (!new Set(["localhost", "127.0.0.1"]).has(hostname)) {
    throw new Error("This smoke test uploads and deletes test records; it is restricted to a local app URL.");
  }
}

async function capture(page: Page, name: string) {
  if (!captureScreenshots) return;
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.screenshot({
      path: path.join(screenshotDirectory, name + "-" + viewport.width + ".jpg"),
      type: "jpeg",
      quality: 84,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

test("private routes send signed-out visitors to login", async ({ page }) => {
  test.setTimeout(90_000);
  assertLocalTarget();
  await page.goto("/login");
  await capture(page, "login");
  await page.goto("/login?denied=1");
  await expect(page.getByRole("heading", { name: /Akses.*belum/ })).toBeVisible();
  await capture(page, "login-denied");

  for (const route of ["/", "/upload", "/admin", "/books/00000000-0000-4000-8000-000000000001"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByRole("heading", { name: /Ruang baca|Akses/ })).toBeVisible();
  }
});

test("an invited member uploads both formats, resumes progress, and cannot expose a file to another member", async ({ browser }) => {
  test.setTimeout(360_000);
  assertLocalTarget();
  test.skip(!existsSync(memberAState) || !existsSync(memberBState), "Run npm run test:e2e:prepare against local Supabase first.");

  const memberA = await browser.newContext({ baseURL, storageState: memberAState });
  const page = await memberA.newPage();
  const cleanup: Array<{ context: BrowserContext; id: string }> = [];
  const uploaded = new Map<string, string>();

  const memberB = await browser.newContext({ baseURL, storageState: memberBState });
  const pageB = await memberB.newPage();

  async function upload(targetContext: BrowserContext, targetPage: Page, filename: string, title: string, author: string, captureMetadata = false) {
    await targetPage.goto("/upload");
    if (title === "The Time Machine" && targetContext === memberA && captureScreenshots) {
      await capture(targetPage, "upload-empty");
    }
    await targetPage.locator('input[type="file"]').setInputFiles(path.join(fixtureDirectory, filename));
    await expect(targetPage.getByLabel("Judul buku")).toBeVisible({ timeout: 90_000 });
    await targetPage.getByLabel("Judul buku").fill(title);
    await targetPage.getByLabel("Penulis").fill(author);
    await targetPage.getByLabel("Bahasa").fill("English");
    await targetPage.getByLabel("Status membaca").selectOption("unread");
    if (captureMetadata) await capture(targetPage, "upload-metadata");
    await targetPage.getByRole("button", { name: "Simpan buku" }).click();
    await targetPage.waitForURL((url) => /\/books\/[0-9a-f-]{36}$/i.test(url.pathname), { timeout: 60_000 });
    const match = targetPage.url().match(/\/books\/([0-9a-f-]{36})$/i);
    if (!match) throw new Error("The saved book did not open its detail page.");
    cleanup.push({ context: targetContext, id: match[1] });
    if (targetContext === memberA) uploaded.set(title, match[1]);
    return match[1];
  }

  async function saveNextProgress(bookId: string) {
    const saveResponse = page.waitForResponse((response) =>
      response.url().includes("/api/books/" + bookId + "/progress") && response.request().method() === "POST" && response.ok(),
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: /Berikutnya/ }).click();
    await saveResponse;
    const response = await memberA.request.get(baseURL + "/api/books/" + bookId + "/progress");
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { progress: { locator: Record<string, unknown>; percent: number } | null };
    expect(body.progress).not.toBeNull();
    return body.progress!;
  }

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Rak/ })).toBeVisible();
    await upload(memberA, page, "the-time-machine.epub", "The Time Machine", "H. G. Wells", true);
    await upload(memberA, page, "the-imprudence-of-prue.pdf", "The Imprudence of Prue", "Sophie Fisher");
    const sharedBookId = await upload(memberB, pageB, "the-time-machine.epub", "The Time Machine", "H. G. Wells");

    await page.goto("/");
    await expect(page.getByRole("button", { name: /The Time Machine.*buka detail/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /The Imprudence of Prue.*buka detail/ })).toBeVisible();
    await capture(page, "shelf-personal");
    await page.goto("/?view=shared");
    await expect(page.getByRole("button", { name: /The Time Machine.*buka detail/ })).toBeVisible();
    await capture(page, "shelf-shared");
    await page.getByRole("button", { name: /The Time Machine.*buka detail/ }).click();
    await expect(page.getByRole("button", { name: "Baca", exact: true })).toBeDisabled();
    await capture(page, "detail-shared");

    const epubId = uploaded.get("The Time Machine")!;
    await page.goto("/books/" + epubId);
    await expect(page.getByRole("heading", { name: /The Time Machine/ })).toBeVisible();
    await capture(page, "detail-owner");
    await page.getByRole("link", { name: "Ubah metadata" }).click();
    await expect(page.getByRole("heading", { name: /Ubah/ })).toBeVisible();
    await capture(page, "edit");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Daftar/ })).toBeVisible();
    await capture(page, "admin");

    await page.goto("/books/" + epubId);
    await page.getByRole("link", { name: "Baca" }).click();
    await expect(page.locator(".epub-mount iframe")).toHaveCount(1, { timeout: 90_000 });
    await capture(page, "reader-epub");
    const epubProgress = await saveNextProgress(epubId);
    expect(epubProgress.locator.format).toBe("epub");
    await page.reload();
    await expect(page.locator(".epub-mount iframe")).toHaveCount(1, { timeout: 90_000 });
    const resumedEpubResponse = await memberA.request.get(baseURL + "/api/books/" + epubId + "/progress");
    const resumedEpub = await resumedEpubResponse.json() as { progress: { locator: Record<string, unknown> } | null };
    expect(resumedEpub.progress?.locator.cfi).toBe(epubProgress.locator.cfi);

    const pdfId = uploaded.get("The Imprudence of Prue")!;
    await page.goto("/books/" + pdfId + "/read");
    await expect(page.locator(".pdf-canvas")).toHaveAttribute("aria-label", /^Halaman 1 dari /, { timeout: 90_000 });
    await capture(page, "reader-pdf");
    const pdfProgress = await saveNextProgress(pdfId);
    expect(pdfProgress.locator).toMatchObject({ format: "pdf", page: 2 });
    await page.reload();
    await expect(page.locator(".pdf-canvas")).toHaveAttribute("aria-label", /^Halaman 2 dari /, { timeout: 90_000 });
    const resumedPdfResponse = await memberA.request.get(baseURL + "/api/books/" + pdfId + "/progress");
    const resumedPdf = await resumedPdfResponse.json() as { progress: { locator: Record<string, unknown> } | null };
    expect(resumedPdf.progress?.locator).toMatchObject({ format: "pdf", page: 2 });

    const sharedDetail = await memberB.request.get(baseURL + "/books/" + epubId);
    expect(sharedDetail.ok()).toBeTruthy();
    const fileResponse = await memberB.request.get(baseURL + "/api/books/" + epubId + "/file-url");
    expect(fileResponse.status()).toBe(404);
    expect(await fileResponse.json()).not.toHaveProperty("url");
    await expect(pageB).toHaveURL(new RegExp("/books/" + sharedBookId));
  } finally {
    for (const row of cleanup) {
      await row.context.request.delete(baseURL + "/api/books/" + row.id).catch(() => undefined);
    }
    await memberB.close();
    await memberA.close();
  }
});
