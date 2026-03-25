"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "trenova_cookie_consent_v1";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(consent: Omit<Consent, "ts">) {
  const payload: Consent = { ...consent, ts: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));

  window.dispatchEvent(
    new CustomEvent("cookie-consent-updated", { detail: payload })
  );
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setOpen(true);
    }
  }, []);
  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 1000);
  }, []);

  if (!open) return null;

  const acceptAll = () => {
    writeConsent({ necessary: true, analytics: true, marketing: true });
    setOpen(false);
  };

  const rejectAll = () => {
    writeConsent({ necessary: true, analytics: false, marketing: false });
    setOpen(false);
  };

  const savePrefs = () => {
    writeConsent({ necessary: true, analytics, marketing });
    setOpen(false);
  };

  return (
    show && (
      <div className="fixed inset-x-0 bottom-0 z-[999] p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-white">
                    Cookie & Privacy
                  </div>
                  <p className="text-sm text-white/70 max-w-2xl">
                    Usiamo cookie necessari per il funzionamento del sito. Con
                    il tuo consenso, possiamo usare cookie{" "}
                    <span className="text-white">analytics</span> e{" "}
                    <span className="text-white">marketing</span> per migliorare
                    l’esperienza. Puoi cambiare idea in qualsiasi momento.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/60">
                    <Link href="/privacy" className="hover:underline">
                      Privacy Policy
                    </Link>
                    <span className="opacity-40">•</span>
                    <Link href="/cookies" className="hover:underline">
                      Cookie Policy
                    </Link>
                    <span className="opacity-40">•</span>
                    <button
                      type="button"
                      onClick={() => setShowPrefs((v) => !v)}
                      className="hover:underline"
                    >
                      {showPrefs ? "Nascondi preferenze" : "Personalizza"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[260px]">
                  <button
                    onClick={acceptAll}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-95"
                  >
                    Accetta tutto
                  </button>

                  <button
                    onClick={rejectAll}
                    className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
                  >
                    Rifiuta non necessari
                  </button>

                  <button
                    onClick={savePrefs}
                    className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
                  >
                    Salva preferenze
                  </button>
                </div>
              </div>

              {showPrefs && (
                <div className="mt-5 grid gap-3 rounded-2xl bg-black/25 ring-1 ring-white/10 p-4">
                  <ToggleRow
                    label="Necessari"
                    desc="Sempre attivi: login, sicurezza, preferenze essenziali."
                    value={true}
                    disabled
                    onChange={() => {}}
                  />

                  <ToggleRow
                    label="Analytics"
                    desc="Statistiche anonime per migliorare il prodotto."
                    value={analytics}
                    onChange={setAnalytics}
                  />

                  <ToggleRow
                    label="Marketing"
                    desc="Misurazione campagne e contenuti personalizzati (se presenti)."
                    value={marketing}
                    onChange={setMarketing}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/60 mt-1">{desc}</div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={[
          "relative h-7 w-12 rounded-full ring-1 ring-white/10 transition",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-95",
          value ? "bg-emerald-400/80" : "bg-white/10",
        ].join(" ")}
        aria-pressed={value}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white transition",
            value ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
