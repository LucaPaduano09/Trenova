"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

type Props = {
  variant: "pt" | "client";
  brand?: string;
  defaultCallbackUrl: string; // es: "/app" o "/c"
};

export default function AuthCard({
  variant,
  brand = "Kinetiq.io",
  defaultCallbackUrl,
}: Props) {
  const sp = useSearchParams();
  const initialMode = (sp.get("mode") as "login" | "register") ?? "login";
  const initialMethod = (sp.get("method") as "magic" | "password") ?? "magic";
  const callbackUrl = sp.get("callbackUrl") ?? defaultCallbackUrl;

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [method, setMethod] = useState<"magic" | "password">(initialMethod);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const title = useMemo(() => {
    if (variant === "pt")
      return mode === "login" ? "Accedi come PT" : "Crea account PT";
    return mode === "login" ? "Accedi come Cliente" : "Crea account Cliente";
  }, [variant, mode]);

  const subtitle = useMemo(() => {
    if (variant === "pt") {
      return mode === "login"
        ? "Gestisci clienti, sessioni e pagamenti in modo semplice."
        : "Inizia in 60 secondi. Il setup viene creato automaticamente.";
    }
    return mode === "login"
      ? "Vedi le tue sessioni, pagamenti e progressi."
      : "Crea il tuo accesso per seguire il percorso con il tuo PT.";
  }, [variant, mode]);

  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    start(async () => {
      const res = await signIn("nodemailer", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) setError("Errore nell’invio del link. Riprova.");
      else setSent(true);
    });
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    start(async () => {
      if (mode === "register") {
        // TODO: quando implementi la registrazione password-based,
        // qui puoi chiamare una server action /api/register (pt o client)
        // poi fare signIn("credentials") subito dopo.
        setError("Registrazione con password non ancora collegata (TODO).");
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) setError("Email o password non valide.");
      else window.location.href = callbackUrl;
    });
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border cf-surface p-6 w-xl">
      <div className="pointer-events-none absolute inset-0 cf-surface" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Image
              alt="logo"
              src={"/landing/brand-image.png"}
              width={100}
              height={50}
            />

            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {title}
            </div>
          </div>

          {/* switch login/register */}
          <div className="rounded-2xl border cf-surface p-1 text-sm">
            <button
              onClick={() => setMode("login")}
              className={[
                "rounded-xl px-3 py-1.5 transition",
                mode === "login"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-neutral-700 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Accedi
            </button>
            <button
              onClick={() => setMode("register")}
              className={[
                "rounded-xl px-3 py-1.5 transition",
                mode === "register"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-neutral-700 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Registrati
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          {subtitle}
        </p>

        {/* switch method */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setMethod("magic")}
            className={[
              "rounded-2xl border px-3 py-2 text-sm transition",
              method === "magic"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white/60 text-neutral-800 hover:bg-white/80 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10",
            ].join(" ")}
          >
            Magic link
          </button>
          <button
            onClick={() => setMethod("password")}
            className={[
              "rounded-2xl border px-3 py-2 text-sm transition",
              method === "password"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white/60 text-neutral-800 hover:bg-white/80 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10",
            ].join(" ")}
          >
            Email + password
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {method === "magic" ? (
          <form onSubmit={onMagicSubmit} className="mt-5 space-y-3">
            <label className="block text-sm cf-text p-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              className="w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text"
              required
            />

            <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100 flex items-center justify-center ">
              <button
                disabled={pending}
                type="submit"
                className=" w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm cf-text font-medium hover:cursor-pointer "
              >
                {pending ? "Invio..." : "Invia magic link"}
              </button>
            </div>

            {sent ? (
              <div className="rounded-2xl border bg-white/60 px-4 py-3 text-sm text-neutral-700 dark:bg-white/5 dark:text-neutral-200">
                Link inviato! Controlla posta e spam/promozioni.
              </div>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ti inviamo un link di accesso. Nessuna password necessaria.
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={onPasswordSubmit} className="mt-5 space-y-3">
            {mode === "register" ? (
              <>
                <label className="block text-sm cf-text">Nome</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome e cognome"
                  className="w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text"
                />
              </>
            ) : null}

            <label className="block text-sm cf-text">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text"
              required
            />

            <label className="block text-sm cf-text">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text"
              required
            />
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100 hover:cursor-pointer">
              <button
                disabled={pending}
                type="submit"
                className="w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm font-medium cf-text hover:cursor-pointer"
              >
                {pending ? "..." : mode === "login" ? "Accedi" : "Crea account"}
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {mode === "login"
                ? "Hai dimenticato la password? (TODO)"
                : "Creando l’account accetti i Termini (TODO)."}
            </p>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-xs cf-text">
          <Link href="/" className="hover:underline">
            ← Torna alla home
          </Link>
          <span className="opacity-80">
            {variant === "pt" ? "Area PT" : "Area Cliente"}
          </span>
        </div>
      </div>
    </div>
  );
}
