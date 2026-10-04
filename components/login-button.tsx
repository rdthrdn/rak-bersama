"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn() {
    if (!enabled || pending) return;
    setPending(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setMessage("Sambungan belum tersedia. Periksa pengaturan masuk.");
      setPending(false);
    }
  }

  return (
    <div className="login-action">
      <button className="gold-button" type="button" disabled={!enabled || pending} onClick={signIn}>
        {pending ? "Menghubungkan…" : enabled ? "Masuk dengan Google" : "Sambungan belum diatur"}
      </button>
      {message && <p className="form-message" role="alert">{message}</p>}
    </div>
  );
}
