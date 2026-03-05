"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { PackageType } from "@prisma/client";
import { createPackage, archivePackage, updatePackage } from "@/actions/packages";
import { useRouter } from "next/navigation";

type PackageRow = {
  id: string;
  name: string;
  type: PackageType;
  sessionCount: number | null;
  monthlyPrice: number | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id?: string;
  name: string;
  type: PackageType;

  sessionCount: string;
  bundlePrice: string;

  monthlyPrice: string;
  monthlySessionCount: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function euro(n: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export default function PackagesClient({
  items,
  flash,
  clients,
}: {
  items: any[];
  flash: string | null;
  clients?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    type: "SESSION_BUNDLE",
    sessionCount: "10",
    bundlePrice: "0",
    monthlyPrice: "99",
    monthlySessionCount: "8",
  });

  const isEdit = Boolean(form.id);

  const hint = useMemo(() => {
    return form.type === "SESSION_BUNDLE"
      ? "Bundle: il cliente consuma 1 credito per sessione."
      : "Mensile: prezzo ricorrente (la logica rinnovo la aggiungiamo dopo).";
  }, [form.type]);

 const openCreate = () => {
  setForm({
    name: "",
    type: "SESSION_BUNDLE",
    sessionCount: "10",
    bundlePrice: "0",
    monthlyPrice: "99",
    monthlySessionCount: "8",
  });
  setOpen(true);
};

const openEdit = (p: any) => {
  setForm({
    id: p.id,
    name: p.name,
    type: p.type,

    sessionCount: p.sessionCount?.toString() ?? "",
    bundlePrice: p.bundlePrice?.toString() ?? "",

    monthlyPrice: p.monthlyPrice?.toString() ?? "",
    monthlySessionCount: p.monthlySessionCount?.toString() ?? "",
  });
  setOpen(true);
};

  const router = useRouter();

  const notice = useMemo(() => {
    if (!flash) return null;

    const flashMap: Record<string, { kind: "ok" | "error"; text: string }> = {
      created: { kind: "ok", text: "Pacchetto creato" },
      updated: { kind: "ok", text: "Pacchetto aggiornato" },

      archived: { kind: "ok", text: "Pacchetto archiviato" },

      archive_blocked: {
        kind: "error",
        text: clients
          ? `Non puoi archiviare il pacchetto: è ancora attivo per ${clients}.`
          : "Non puoi archiviare questo pacchetto perché è ancora attivo.",
      },
    };

    return flashMap[flash] ?? null;
  }, [flash, clients]);

  useEffect(() => {
    if (!notice) return;

    const t = window.setTimeout(() => {
      router.replace("/app/packages");
    }, 2500);

    return () => window.clearTimeout(t);
  }, [notice, router]);

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          className={[
            "rounded-3xl border px-4 py-3 text-sm cf-surface cf-hairline",
            notice.kind === "error"
              ? "border-red-200/60 text-red-700 dark:border-red-500/20 dark:text-red-200"
              : "border-emerald-200/60 text-emerald-700 dark:border-emerald-500/20 dark:text-emerald-200",
          ].join(" ")}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold cf-text">Pacchetti</h1>
          <p className="mt-1 text-sm cf-muted">
            Definisci bundle di sessioni o abbonamenti mensili.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-2xl px-4 py-2 text-sm font-semibold bg-neutral-900 text-white hover:opacity-95 dark:bg-white dark:text-neutral-900"
        >
          + Nuovo pacchetto
        </button>
      </div>

      <div className="cf-card">
        {items.length === 0 ? (
          <div className="py-6 text-sm cf-muted">
            Nessun pacchetto. Clicca <span className="font-medium">“Nuovo pacchetto”</span>.
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold cf-text">{p.name}</div>

                    <span
                      className={cx(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] border",
                        p.type === "SESSION_BUNDLE"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      {p.type === "SESSION_BUNDLE" ? "Bundle" : "Mensile"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs cf-muted">
                    {p.type === "SESSION_BUNDLE" ? (
                      <span>{p.sessionCount ?? 0} sessioni</span>
                    ) : (
                      <span>{p.monthlyPrice ? `${euro(p.monthlyPrice)}/mese` : "—"}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    Modifica
                  </button>

                  {/* ✅ non è delete, è ARCHIVE */}
                  <button
                    type="button"
                    onClick={() => setConfirmId(p.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium border border-red-500/25 text-red-700 hover:bg-red-500/10 dark:text-red-300"
                  >
                    Archivia
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal create/edit */}
      {open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            aria-label="Chiudi"
          />

          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <div className="cf-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold cf-text">
                    {isEdit ? "Modifica pacchetto" : "Nuovo pacchetto"}
                  </div>
                  <div className="mt-1 text-xs cf-muted">{hint}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-1 text-xs border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  Chiudi
                </button>
              </div>

              <form action={isEdit ? updatePackage : createPackage} className="mt-4 grid gap-3">
                {isEdit ? <input type="hidden" name="packageId" value={form.id} /> : null}

                <label className="grid gap-1">
                  <span className="text-xs cf-muted">Nome</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                    placeholder="Es. 10 sessioni PT"
                    required
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs cf-muted">Tipo</span>
                  <select
                    name="type"
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as PackageType }))}
                    className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                  >
                    <option value="SESSION_BUNDLE">Bundle sessioni</option>
                    <option value="MONTHLY">Abbonamento mensile</option>
                  </select>
                </label>

               {form.type === "SESSION_BUNDLE" ? (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs cf-muted">Numero sessioni</span>
                      <input
                        name="sessionCount"
                        inputMode="numeric"
                        value={form.sessionCount}
                        onChange={(e) => setForm((s) => ({ ...s, sessionCount: e.target.value }))}
                        className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                        placeholder="10"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-xs cf-muted">Prezzo bundle (€) (opzionale)</span>
                      <input
                        name="bundlePrice"
                        inputMode="decimal"
                        value={form.bundlePrice}
                        onChange={(e) => setForm((s) => ({ ...s, bundlePrice: e.target.value }))}
                        className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                        placeholder="150"
                      />
                    </label>

                    {/* hidden per monthly */}
                    <input type="hidden" name="monthlyPrice" value="" />
                    <input type="hidden" name="monthlySessionCount" value="" />
                  </>
                ) : (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs cf-muted">Prezzo mensile (€)</span>
                      <input
                        name="monthlyPrice"
                        inputMode="decimal"
                        value={form.monthlyPrice}
                        onChange={(e) => setForm((s) => ({ ...s, monthlyPrice: e.target.value }))}
                        className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                        placeholder="99"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-xs cf-muted">Crediti/mese</span>
                      <input
                        name="monthlySessionCount"
                        inputMode="numeric"
                        value={form.monthlySessionCount}
                        onChange={(e) => setForm((s) => ({ ...s, monthlySessionCount: e.target.value }))}
                        className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/5"
                        placeholder="8"
                      />
                    </label>

                    {/* hidden per bundle */}
                    <input type="hidden" name="sessionCount" value="" />
                    <input type="hidden" name="bundlePrice" value="" />
                  </>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl px-4 py-2 text-sm font-semibold bg-neutral-900 text-white hover:opacity-95 dark:bg-white dark:text-neutral-900"
                  >
                    {isEdit ? "Salva" : "Crea"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {/* Confirm archive */}
      {confirmId ? (
        <>
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            aria-label="Chiudi"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="cf-card">
              <div className="text-sm font-semibold cf-text">Archiviare pacchetto?</div>
              <div className="mt-1 text-xs cf-muted">
                Il pacchetto non sarà più selezionabile per nuovi clienti. Lo storico resta.
              </div>

              <form action={archivePackage} className="mt-4 flex justify-end gap-2">
                <input type="hidden" name="packageId" value={confirmId} />
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="rounded-2xl px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:opacity-95"
                >
                  Archivia
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}