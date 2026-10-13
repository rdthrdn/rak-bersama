"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export function EmailPasswordForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminSetupCode, setAdminSetupCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setIsError(false);
    setAdminSetupCode("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;

    const normalizedEmail = email.trim().toLowerCase();
    setPending(true);
    setMessage("");
    setIsError(false);

    try {
      const supabase = createClient();

      if (mode === "register") {
        if (password.length < 8) throw new Error("Kata sandi harus berisi minimal 8 karakter.");
        if (password !== confirmPassword) throw new Error("Konfirmasi kata sandi belum cocok.");

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            displayName: displayName.trim(),
            adminSetupCode: adminSetupCode.trim(),
          }),
        });
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(result?.error || "Akun belum dapat dibuat. Coba lagi.");
      }

      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        throw new Error(mode === "login"
          ? "Email atau kata sandi belum cocok. Periksa kembali lalu coba lagi."
          : "Akun sudah dibuat, tetapi belum dapat dimasuki. Coba masuk dengan email dan kata sandi tadi.");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Sambungan belum tersedia. Coba lagi.");
      setPending(false);
    }
  }

  return (
    <div className="login-action">
      <div className="auth-tabs" role="tablist" aria-label="Akses akun">
        <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")}>
          Masuk
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")}>
          Daftar
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && (
          <label className="auth-field">
            Nama tampilan
            <input
              autoComplete="name"
              maxLength={80}
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        )}
        <label className="auth-field">
          Email
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="auth-field">
          Kata sandi
          <input
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mode === "register" && (
          <label className="auth-field">
            Ulangi kata sandi
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}
        {mode === "register" && (
          <>
            <label className="auth-field">
              Kode pengelola awal (opsional)
              <input
                type="password"
                autoComplete="off"
                maxLength={64}
                value={adminSetupCode}
                onChange={(event) => setAdminSetupCode(event.target.value)}
              />
            </label>
            <p className="auth-note">Pendaftaran terbuka dan akun langsung aktif tanpa verifikasi email. Kode hanya untuk admin awal.</p>
          </>
        )}
        <button className="gold-button auth-submit" type="submit" disabled={!enabled || pending}>
          {pending ? "Memproses…" : mode === "login" ? "Masuk" : "Buat akun"}
        </button>
        {!enabled && <p className="form-message is-error" role="status">Sambungan arsip belum diatur.</p>}
        {message && <p className={isError ? "form-message is-error" : "form-message"} role={isError ? "alert" : "status"}>{message}</p>}
      </form>
    </div>
  );
}
