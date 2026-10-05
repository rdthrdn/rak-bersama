import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const localEnvPath = path.resolve(".env.local");
const localEnv = await readFile(localEnvPath, "utf8").catch(() => {
  throw new Error("Create .env.local with the local Supabase URL and keys before preparing browser tests.");
});
for (const line of localEnv.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
  if (process.env[match[1]] === undefined) process.env[match[1]] = value;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const browserOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000").origin;

if (!supabaseUrl || !anonKey || !serviceKey || !adminEmail) {
  throw new Error("Local E2E setup requires the Supabase URL, anon key, service role key, and ADMIN_EMAIL.");
}
if (!new Set(["localhost", "127.0.0.1"]).has(new URL(supabaseUrl).hostname)) {
  throw new Error("Local E2E users can only be prepared against a Supabase URL on this computer.");
}
if (!new Set(["localhost", "127.0.0.1"]).has(new URL(browserOrigin).hostname)) {
  throw new Error("Local E2E storage states can only be prepared for a local app URL.");
}

const memberEmail = "qa-member@example.test";
const secondMemberEmail = "qa-member-b@example.test";
if (adminEmail !== memberEmail) {
  throw new Error("For the isolated local E2E seed, set ADMIN_EMAIL=qa-member@example.test in .env.local.");
}

const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function ensureUser(email, displayName, role) {
  const { data: listed, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error("Could not inspect local auth users: " + listError.message);
  let user = listed.users.find((entry) => entry.email?.toLowerCase() === email);
  const password = randomBytes(36).toString("base64url") + "!Aa9";
  if (!user) {
    const created = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: displayName } });
    if (created.error || !created.data.user) throw new Error("Could not create a local E2E account: " + (created.error?.message || "unknown error"));
    user = created.data.user;
  } else {
    const updated = await adminClient.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { full_name: displayName } });
    if (updated.error) throw new Error("Could not refresh a local E2E account: " + updated.error.message);
    user = updated.data.user;
  }

  const allowed = await adminClient.from("allowed_emails").upsert({ email }, { onConflict: "email" });
  if (allowed.error) throw new Error("Could not seed the local allowlist: " + allowed.error.message);
  const profile = await adminClient.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    initials: role === "admin" ? "QA" : "QB",
    role,
  }, { onConflict: "id" });
  if (profile.error) throw new Error("Could not seed the local profile: " + profile.error.message);

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw new Error("Could not create a local browser session: " + (signedIn.error?.message || "unknown error"));
  const session = signedIn.data.session;
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  const cookie = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const state = {
    cookies: [{
      name: storageKey,
      value: cookie,
      domain: new URL(browserOrigin).hostname,
      path: "/",
      expires: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
      httpOnly: false,
      secure: new URL(browserOrigin).protocol === "https:",
      sameSite: "Lax",
    }],
    origins: [],
  };
  const authDirectory = path.resolve("tests/e2e/.auth");
  await mkdir(authDirectory, { recursive: true });
  const filename = role === "admin" ? "member-a.json" : "member-b.json";
  await writeFile(path.join(authDirectory, filename), JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
}

await ensureUser(memberEmail, "Anggota QA", "admin");
await ensureUser(secondMemberEmail, "Anggota QA B", "member");
console.log("Local-only member browser states created under tests/e2e/.auth/.");
