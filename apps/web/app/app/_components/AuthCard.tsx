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
  defaultCallbackUrl: string;
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
  const p = pw ?? "";
  let score = 0;

  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  const clamped = Math.min(4, Math.max(0, score - 1));
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
  const [sent, setSent] = useState(false);

  const [emailCheck, setEmailCheck] = useState<EmailCheckState>({
    status: "idle",
  });
  const lastEmailCheckedRef = useRef<string>("");

  const title = useMemo(() => {
    if (variant === "pt") {
      return mode === "login" ? "Accedi come PT" : "Crea account PT";
    }
    return mode === "login" ? "Accedi come Cliente" : "Crea account Cliente";
  }, [variant, mode]);

  const subtitle = useMemo(() => {
    if (variant === "pt") {
      return mode === "login"
        ? "Gestisci clienti, sessioni e pagamenti in un’unica area."
        : "Inizia in pochi secondi. Il setup viene creato automaticamente.";
    }
    return mode === "login"
      ? "Consulta sessioni, progressi e dettagli del tuo percorso."
      : "Crea il tuo accesso per seguire il percorso con il tuo PT.";
  }, [variant, mode]);

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailOk = useMemo(() => isValidEmail(emailNorm), [emailNorm]);

  const pw = useMemo(() => password ?? "", [password]);
  const pwOkRegister = useMemo(() => pw.length >= 8, [pw]);
  const strength = useMemo(() => passwordStrength(pw), [pw]);

  useEffect(() => {
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

        if (json.exists) {
          setEmailCheck({ status: "taken", verified: json.verified });
        } else {
          setEmailCheck({ status: "available" });
        }
      } catch {
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

    if (!pwOkRegister) return false;
    if (emailCheck.status === "checking") return false;
    if (emailCheck.status === "taken") return false;
    if (emailCheck.status === "invalid") return false;

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
        if (emailCheck.status === "taken") {
          setError(
            emailCheck.verified
              ? "Email già registrata. Prova ad accedere."
              : "Email già registrata ma non verificata. Ti reinviamo la mail di conferma."
          );
          return;
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

        if (r.needsVerify) {
          setSent(true);
          return;
        }

        window.location.href = callbackUrl;
        return;
      }

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

  const forgotHref =
    variant === "pt" ? "/app/forgot-password" : "/c/forgot-password";

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6 lg:max-w-[720px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[31px] border border-white/5" />

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Image
              alt={brand}
              src="/landing/Frame-1.svg"
              width={150}
              height={50}
              className="mb-2 ml-[-7px] h-auto w-[108px] opacity-95 sm:w-[120px]"
              priority
            />
            <div className="text-sm font-medium text-white/88">{title}</div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-sm backdrop-blur">
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSent(false);
                }}
                className={[
                  "rounded-xl px-3 py-2 transition",
                  mode === "login"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/70 hover:bg-white/6 hover:text-white",
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
                  "rounded-xl px-3 py-2 transition",
                  mode === "register"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/70 hover:bg-white/6 hover:text-white",
                ].join(" ")}
              >
                Registrati
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">
          {subtitle}
        </p>

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
                ? "border-white/15 bg-white text-black"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white",
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
                ? "border-white/15 bg-white text-black"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
          >
            Email + password
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Ti abbiamo inviato una mail. Controlla posta e spam/promozioni.
          </div>
        ) : null}

        {method === "magic" ? (
          <form onSubmit={onMagicSubmit} className="mt-6 space-y-3">
            <label className="block px-1 text-sm text-white/82">Email</label>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              className={[
                "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25",
                "border-white/10 focus:border-white/20 focus:bg-white/[0.06]",
                email.length > 0 && !emailOk
                  ? "border-red-400/40 focus:border-red-400/50"
                  : "",
              ].join(" ")}
              required
            />

            {email.length > 0 && !emailOk ? (
              <p className="text-xs text-red-300">Inserisci un’email valida.</p>
            ) : null}

            <div className="rounded-2xl bg-gradient-to-r from-emerald-400/90 to-blue-500/90 p-[1px] shadow-[0_0_30px_rgba(16,185,129,0.12)]">
              <button
                disabled={!canSubmitMagic}
                type="submit"
                className="w-full rounded-2xl bg-black/80 px-4 py-3 text-sm font-medium text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending ? "Invio..." : "Invia magic link"}
              </button>
            </div>

            <p className="text-xs leading-5 text-white/45">
              Ti inviamo un link di accesso. Nessuna password necessaria.
            </p>
          </form>
        ) : (
          <form onSubmit={onPasswordSubmit} className="mt-6 space-y-3">
            {mode === "register" ? (
              <>
                <label className="block px-1 text-sm text-white/82">Nome</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome e cognome"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.06]"
                />
              </>
            ) : null}

            <label className="block px-1 text-sm text-white/82">Email</label>
            <input
              value={email}
              onChange={(e) => {
                const v = e.target.value;
                setEmail(v);
                lastEmailCheckedRef.current = "";
              }}
              type="email"
              placeholder="you@email.com"
              className={[
                "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25",
                "focus:bg-white/[0.06]",
                email.length > 0 && !emailOk
                  ? "border-red-400/40 focus:border-red-400/50"
                  : mode === "register" && emailCheck.status === "taken"
                  ? "border-red-400/40 focus:border-red-400/50"
                  : mode === "register" && emailCheck.status === "available"
                  ? "border-emerald-400/35 focus:border-emerald-400/45"
                  : "border-white/10 focus:border-white/20",
              ].join(" ")}
              required
            />

            {mode === "register" ? (
              <div className="text-xs">
                {emailNorm.length === 0 ? (
                  <span className="text-white/42">
                    Inserisci un’email per verificare la disponibilità.
                  </span>
                ) : !emailOk ? (
                  <span className="text-red-300">Email non valida.</span>
                ) : emailCheck.status === "checking" ? (
                  <span className="text-white/42">Controllo disponibilità…</span>
                ) : emailCheck.status === "available" ? (
                  <span className="text-emerald-300">Email disponibile.</span>
                ) : emailCheck.status === "taken" ? (
                  <span className="text-red-300">
                    Email già registrata{" "}
                    {emailCheck.verified ? "(verificata)" : "(non verificata)"}.
                  </span>
                ) : null}
              </div>
            ) : null}

            <label className="block px-1 text-sm text-white/82">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={[
                "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25",
                "border-white/10 focus:border-white/20 focus:bg-white/[0.06]",
                mode === "register" && password.length > 0 && !pwOkRegister
                  ? "border-red-400/40 focus:border-red-400/50"
                  : "",
              ].join(" ")}
              required
            />

            {mode === "register" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/42">Strength</span>
                  <span
                    className={[
                      "font-medium",
                      strength.score <= 1
                        ? "text-red-300"
                        : strength.score === 2
                        ? "text-white/70"
                        : "text-emerald-300",
                    ].join(" ")}
                  >
                    {strength.label}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={[
                        "h-1.5 flex-1 rounded-full",
                        strength.score >= i + 1
                          ? "bg-white"
                          : "bg-white/10",
                      ].join(" ")}
                    />
                  ))}
                </div>

                {password.length > 0 && !pwOkRegister ? (
                  <p className="text-xs text-red-300">Minimo 8 caratteri.</p>
                ) : (
                  <p className="text-xs leading-5 text-white/42">
                    Consiglio: 12+ caratteri, maiuscole/minuscole, numeri e un
                    simbolo.
                  </p>
                )}
              </div>
            ) : null}

            <div className="rounded-2xl bg-gradient-to-r from-emerald-400/90 to-blue-500/90 p-[1px] shadow-[0_0_30px_rgba(59,130,246,0.10)]">
              <button
                disabled={!canSubmitPassword}
                type="submit"
                className="w-full rounded-2xl bg-black/80 px-4 py-3 text-sm font-medium text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending ? "..." : mode === "login" ? "Accedi" : "Crea account"}
              </button>
            </div>

            <p className="text-xs text-white/42">
              {mode === "login" ? (
                <Link href={forgotHref} className="hover:text-white/70 hover:underline">
                  Hai dimenticato la password?
                </Link>
              ) : (
                "Creando l’account accetti i Termini (TODO)."
              )}
            </p>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-white/50">
          <Link href="/" className="transition hover:text-white/80 hover:underline">
            ← Torna alla home
          </Link>

          <span>{variant === "pt" ? "Area PT" : "Area Cliente"}</span>
        </div>
      </div>
    </div>
  );
}