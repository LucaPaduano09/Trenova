"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { registerWithPassword } from "@/actions/registerWithPassword";

type Props = {
  variant: "pt" | "client";
  brand?: string;
  defaultCallbackUrl: string; // es: "/app" o "/c"
};

type EmailCheckState =
  | { status: "idle" }
  | { status: "invalid" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "taken"; verified: boolean };

function isValidEmail(v: string) {
  const s = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function passwordStrength(pw: string) {
  // score 0..4 + label
  const p = pw ?? "";
  let score = 0;

  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  // comprimi in 0..4
  const clamped = Math.min(4, Math.max(0, score - 1)); // così 8 chars = 0/1 “weak”
  const labels = ["Debole", "Ok", "Buona", "Forte", "Molto forte"] as const;
  const label = labels[Math.min(4, clamped)];

  return { score: clamped, label };
}

export default function AuthCard({
  variant,
  brand = "Trenova",
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

  // "sent" lo useremo sia per magic che per register (messaggio email inviata)
  const [sent, setSent] = useState(false);

  // Live email availability
  const [emailCheck, setEmailCheck] = useState<EmailCheckState>({
    status: "idle",
  });
  const lastEmailCheckedRef = useRef<string>("");

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

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailOk = useMemo(() => isValidEmail(emailNorm), [emailNorm]);

  const pw = useMemo(() => password ?? "", [password]);
  const pwOkRegister = useMemo(() => pw.length >= 8, [pw]);
  const strength = useMemo(() => passwordStrength(pw), [pw]);

  // Debounced email check (solo in register, e solo se email valida)
  useEffect(() => {
    // reset
    setSent(false);
    setError(null);

    if (mode !== "register") {
      setEmailCheck({ status: "idle" });
      return;
    }

    if (!emailNorm) {
      setEmailCheck({ status: "idle" });
      return;
    }

    if (!emailOk) {
      setEmailCheck({ status: "invalid" });
      return;
    }

    // evita doppie chiamate per stesso valore
    if (lastEmailCheckedRef.current === emailNorm) return;

    const t = setTimeout(async () => {
      try {
        setEmailCheck({ status: "checking" });

        const res = await fetch(
          `/api/check-email?email=${encodeURIComponent(emailNorm)}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("check failed");
        const json: { ok: boolean; exists: boolean; verified: boolean } =
          await res.json();

        lastEmailCheckedRef.current = emailNorm;

        if (json.exists)
          setEmailCheck({ status: "taken", verified: json.verified });
        else setEmailCheck({ status: "available" });
      } catch {
        // se fallisce, non blocchiamo l'utente (ma non diamo ok)
        setEmailCheck({ status: "idle" });
      }
    }, 450);

    return () => clearTimeout(t);
  }, [mode, emailNorm, emailOk]);

  const canSubmitMagic = useMemo(() => {
    return emailOk && !pending;
  }, [emailOk, pending]);

  const canSubmitPassword = useMemo(() => {
    if (pending) return false;
    if (!emailOk) return false;

    if (mode === "login") return pw.length > 0;

    // register
    if (!pwOkRegister) return false;
    if (emailCheck.status === "checking") return false;
    if (emailCheck.status === "taken") return false; // già registrata
    if (emailCheck.status === "invalid") return false;
    // idle/available: ok (idle può succedere se fetch fallisce: lasciamo passare e server farà da guardia)
    return true;
  }, [pending, mode, emailOk, pw.length, pwOkRegister, emailCheck.status]);

  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    start(async () => {
      const res = await signIn("nodemailer", {
        email: emailNorm,
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
    setSent(false);

    start(async () => {
      if (mode === "register") {
        // guardia UX (anche se server valida comunque)
        if (emailCheck.status === "taken") {
          setError(
            emailCheck.verified
              ? "Email già registrata. Prova ad accedere."
              : "Email già registrata ma non verificata. Ti reinviamo la mail di conferma."
          );
        }

        const r = await registerWithPassword({
          email: emailNorm,
          password,
          fullName,
          variant,
        });

        if (!r.ok) {
          setError(r.error || "Errore registrazione.");
          return;
        }

        //  ' qui NON facciamo signIn: mostriamo messaggio email inviata
        if (r.needsVerify) {
          setSent(true);
          return;
        }

        window.location.href = callbackUrl;
        return;
      }

      // LOGIN
      const res = await signIn("credentials", {
        email: emailNorm,
        password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) setError("Email o password non valide.");
      else window.location.href = callbackUrl;
    });
  }

  return (
    <div className="relative w-full max-w-[520px] lg:max-w-[820px] lg:w-[820px] overflow-hidden rounded-3xl border cf-surface p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 cf-surface" />

      <div className="relative">
        {/* Header: su mobile va in colonna, su sm+ torna row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              {title}
            </div>
          </div>

          {/* Switch login/register: full width su mobile */}
          <div className="w-full sm:w-auto">
            <div className="grid grid-cols-2 rounded-2xl border cf-surface p-1 text-sm">
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSent(false);
                }}
                className={[
                  "rounded-xl px-3 py-2 sm:py-1.5 transition",
                  mode === "login"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-neutral-700 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-white/10",
                ].join(" ")}
              >
                Accedi
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSent(false);
                  lastEmailCheckedRef.current = "";
                }}
                className={[
                  "rounded-xl px-3 py-2 sm:py-1.5 transition",
                  mode === "register"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-neutral-700 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-white/10",
                ].join(" ")}
              >
                Registrati
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {subtitle}
        </p>

        {/* Method switch: su mobile 2 colonne, su sm torna inline */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => {
              setMethod("magic");
              setError(null);
              setSent(false);
            }}
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
            onClick={() => {
              setMethod("password");
              setError(null);
              setSent(false);
            }}
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

        {sent ? (
          <div className="mt-4 rounded-2xl border bg-white/60 px-4 py-3 text-sm text-neutral-700 dark:bg-white/5 dark:text-neutral-200">
            Ti abbiamo inviato una mail. Controlla posta e spam/promozioni.
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
              className={[
                "w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text",
                email.length > 0 && !emailOk ? "border-red-300" : "",
              ].join(" ")}
              required
            />

            {email.length > 0 && !emailOk ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                Inserisci un’email valida.
              </p>
            ) : null}

            <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100 flex items-center justify-center">
              <button
                disabled={!canSubmitMagic}
                type="submit"
                className="w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm cf-text font-medium hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Invio..." : "Invia magic link"}
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ti inviamo un link di accesso. Nessuna password necessaria.
            </p>
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
              onChange={(e) => {
                const v = e.target.value;
                setEmail(v);
                lastEmailCheckedRef.current = "";
              }}
              type="email"
              className={[
                "w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text",
                email.length > 0 && !emailOk ? "border-red-300" : "",
                mode === "register" && emailCheck.status === "taken"
                  ? "border-red-300"
                  : "",
                mode === "register" && emailCheck.status === "available"
                  ? "border-emerald-300"
                  : "",
              ].join(" ")}
              required
            />

            {/* Email availability hint */}
            {mode === "register" ? (
              <div className="text-xs">
                {emailNorm.length === 0 ? (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Inserisci un’email per verificare la disponibilità.
                  </span>
                ) : !emailOk ? (
                  <span className="text-red-600 dark:text-red-300">
                    Email non valida.
                  </span>
                ) : emailCheck.status === "checking" ? (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Controllo disponibilità…
                  </span>
                ) : emailCheck.status === "available" ? (
                  <span className="text-emerald-600 dark:text-emerald-300">
                    Email disponibile '
                  </span>
                ) : emailCheck.status === "taken" ? (
                  <span className="text-red-600 dark:text-red-300">
                    Email già registrata{" "}
                    {emailCheck.verified ? "(verificata)" : "(non verificata)"}.
                  </span>
                ) : null}
              </div>
            ) : null}

            <label className="block text-sm cf-text">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={[
                "w-full rounded-2xl border cf-card px-4 py-3 text-sm outline-none cf-text",
                mode === "register" && password.length > 0 && !pwOkRegister
                  ? "border-red-300"
                  : "",
              ].join(" ")}
              required
            />

            {/* Strength meter */}
            {mode === "register" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Strength
                  </span>
                  <span
                    className={[
                      "font-medium",
                      strength.score <= 1
                        ? "text-red-600 dark:text-red-300"
                        : strength.score === 2
                        ? "text-neutral-700 dark:text-neutral-200"
                        : "text-emerald-700 dark:text-emerald-300",
                    ].join(" ")}
                  >
                    {strength.label}
                  </span>
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

                {password.length > 0 && !pwOkRegister ? (
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Minimo 8 caratteri.
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Consiglio: 12+ caratteri, maiuscole/minuscole, numeri e un
                    simbolo.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60 hover:opacity-100 hover:cursor-pointer">
              <button
                disabled={!canSubmitPassword}
                type="submit"
                className="w-full m-1 bg-white rounded-2xl px-4 py-3 text-sm font-medium cf-text hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "..." : mode === "login" ? "Accedi" : "Crea account"}
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {mode === "login" ? (
                <Link
                  href="/app/forgot-password"
                  className="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                >
                  Hai dimenticato la password?
                </Link>
              ) : (
                "Creando l’account accetti i Termini (TODO)."
              )}
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
