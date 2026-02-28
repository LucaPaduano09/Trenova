"use client";

import { useMemo, useState, useTransition } from "react";
import { resetPassword } from "../../../actions/resetPassword";

function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, Math.max(0, s - 1));
  const labels = ["Debole", "Ok", "Buona", "Forte", "Molto forte"] as const;
  return { score, label: labels[Math.min(4, score)] };
}

export default function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ok = useMemo(() => pw1.length >= 8 && pw1 === pw2, [pw1, pw2]);
  const strength = useMemo(() => passwordStrength(pw1), [pw1]);

  return (
    <div className="rounded-3xl border cf-surface p-4 sm:p-6">
      <h1 className="text-lg font-semibold cf-text">Reimposta password</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Scegli una nuova password per il tuo account.
      </p>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {err}
        </div>
      ) : null}

      {msg ? (
        <div className="mt-4 rounded-2xl border bg-white/60 px-4 py-3 text-sm text-neutral-700 dark:bg-white/5 dark:text-neutral-200">
          {msg}
        </div>
      ) : null}

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          setMsg(null);

          if (!token || !email) {
            setErr("Link non valido. Richiedi un nuovo reset.");
            return;
          }

          start(async () => {
            const res = await resetPassword({ token, email, newPassword: pw1 });
            if (!res.ok) {
              setErr(res.error ?? "Impossibile reimpostare la password.");
              return;
            }
            setMsg("Password aggiornata! Ora puoi accedere.");
          });
        }}
      >
        <label className="block text-sm cf-text">Nuova password</label>
        <input
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          type="password"
          className="w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text"
          required
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Strength
            </span>
            <span className="font-medium cf-text">{strength.label}</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={[
                  "h-1.5 flex-1 rounded-full border",
                  strength.score >= i + 1
                    ? "bg-black dark:bg-white"
                    : "bg-transparent",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Minimo 8 caratteri (consigliato 12+).
          </p>
        </div>

        <label className="block text-sm cf-text">Conferma password</label>
        <input
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          type="password"
          className={[
            "w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text",
            pw2.length > 0 && pw1 !== pw2 ? "border-red-300" : "",
          ].join(" ")}
          required
        />
        {pw2.length > 0 && pw1 !== pw2 ? (
          <p className="text-xs text-red-600 dark:text-red-300">
            Le password non coincidono.
          </p>
        ) : null}

        <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100">
          <button
            disabled={pending || !ok}
            type="submit"
            className="w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm font-medium cf-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "..." : "Aggiorna password"}
          </button>
        </div>
      </form>
    </div>
  );
}
