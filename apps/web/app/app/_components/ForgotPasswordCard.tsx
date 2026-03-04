"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { requestPasswordReset } from "@/actions/requestPasswordReset";

function isValidEmail(v: string) {
  const s = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Semplice “mail provider guess” per offrire un bottone più pertinente
function guessMailProvider(email: string) {
  const e = email.trim().toLowerCase();
  if (e.endsWith("@gmail.com") || e.endsWith("@googlemail.com")) return "gmail";
  if (
    e.endsWith("@outlook.com") ||
    e.endsWith("@hotmail.com") ||
    e.endsWith("@live.com")
  )
    return "outlook";
  if (
    e.endsWith("@icloud.com") ||
    e.endsWith("@me.com") ||
    e.endsWith("@mac.com")
  )
    return "icloud";
  return "generic";
}

export default function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailOk = useMemo(() => isValidEmail(emailNorm), [emailNorm]);
  const provider = useMemo(() => guessMailProvider(emailNorm), [emailNorm]);

  function openInbox() {
    // Non possiamo aprire il client nativo in modo affidabile via web,
    // quindi apriamo i web inbox più comuni.
    if (provider === "gmail")
      window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
    else if (provider === "outlook")
      window.open(
        "https://outlook.live.com/mail",
        "_blank",
        "noopener,noreferrer"
      );
    else if (provider === "icloud")
      window.open(
        "https://www.icloud.com/mail",
        "_blank",
        "noopener,noreferrer"
      );
    else
      window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border cf-surface p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 cf-surface" />

      <div className="relative">
        {/* Header (coerente con AuthCard) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Image
              alt="logo"
              src={"/landing/Frame-1.svg"}
              width={120}
              height={50}
              className="mb-2 ml-[-7px] h-auto w-[108px] sm:w-[120px]"
              priority
            />
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Password dimenticata
            </div>
          </div>

          {/* Pill “Back to login” */}
          <div className="w-full sm:w-auto">
            <Link
              href="/app/sign-in"
              className="block rounded-2xl border cf-surface px-4 py-2 text-center text-sm text-neutral-800 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-white/10"
            >
              ← Torna al login
            </Link>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Inserisci la tua email. Se esiste un account, ti invieremo un link per
          reimpostare la password.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="mt-4 rounded-2xl border bg-white/60 px-4 py-3 text-sm text-neutral-700 dark:bg-white/5 dark:text-neutral-200">
            Se l’email è associata a un account, ti abbiamo inviato un link di
            reset. Controlla anche spam/promozioni.
          </div>
        ) : null}

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSent(false);

            if (!emailOk) {
              setError("Inserisci un’email valida.");
              return;
            }

            start(async () => {
              await requestPasswordReset({ email: emailNorm });
              setSent(true);
            });
          }}
        >
          <label className="block text-sm cf-text">Email</label>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            type="email"
            className={[
              "w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text",
              email.length > 0 && !emailOk ? "border-red-300" : "",
            ].join(" ")}
            placeholder="you@email.com"
            required
          />

          {email.length > 0 && !emailOk ? (
            <p className="text-xs text-red-600 dark:text-red-300">
              Inserisci un’email valida.
            </p>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ti invieremo un link valido per pochi minuti.
            </p>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100">
            <button
              disabled={pending || !emailOk}
              className="w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm font-medium cf-text disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Invio..." : "Invia link reset"}
            </button>
          </div>
        </form>

        {/* Post-send quick actions */}
        {sent ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={openInbox}
              className="rounded-2xl border cf-surface px-4 py-3 text-sm cf-text hover:bg-white/70 dark:hover:bg-white/10"
            >
              Apri{" "}
              {provider === "gmail"
                ? "Gmail"
                : provider === "outlook"
                ? "Outlook"
                : provider === "icloud"
                ? "iCloud Mail"
                : "la posta"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  "https://www.trenova.it/app/sign-in"
                )
              }
              className="rounded-2xl border cf-surface px-4 py-3 text-sm cf-text hover:bg-white/70 dark:hover:bg-white/10"
            >
              Copia link login
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between text-xs cf-text">
          <Link href="/" className="hover:underline">
            ← Torna alla home
          </Link>
          <span className="opacity-80">Area PT</span>
        </div>
      </div>
    </div>
  );
}
