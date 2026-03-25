"use client";

import { useActionState, useMemo, useState, useEffect } from "react";
import {
  createSession,
  updateSession,
  duplicateSession,
} from "@/actions/booking";

const initialState = {
  ok: true as const,
  error: {} as Record<string, string[]>,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type Mode =
  | { kind: "create"; clientSlug: string }
  | { kind: "edit"; id: string; defaults: any }
  | { kind: "duplicate"; sourceId: string; defaults?: any };

export default function SessionForm({ mode }: { mode: Mode }) {
  const actionFn =
    mode.kind === "create"
      ? createSession
      : mode.kind === "edit"
      ? updateSession
      : duplicateSession;

  const [state, action] = useActionState(actionFn as any, initialState);
  const e = (key: string) => state?.error?.[key]?.[0];

  const defaults = useMemo(() => {
    if (mode.kind === "create") return null;
    return mode.defaults ?? null;
  }, [mode]);

  const [statusValue, setStatusValue] = useState<string>(
    mode.kind === "edit" ? defaults?.status ?? "SCHEDULED" : "SCHEDULED"
  );

  const [isPaidChecked, setIsPaidChecked] = useState<boolean>(
    Boolean(defaults?.paidAt)
  );

  useEffect(() => {
    if (mode.kind === "edit") {
      setStatusValue(defaults?.status ?? "SCHEDULED");
      setIsPaidChecked(Boolean(defaults?.paidAt));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, defaults?.status, defaults?.paidAt]);

  useEffect(() => {
    if (mode.kind === "edit" && statusValue === "CANCELED") {
      setIsPaidChecked(false);
    }
  }, [mode.kind, statusValue]);

  return (
    <form action={action} className="space-y-5">
      {mode.kind === "create" ? (
        <input type="hidden" name="clientSlug" value={mode.clientSlug} />
      ) : mode.kind === "edit" ? (
        <input type="hidden" name="id" value={mode.id} />
      ) : (
        <input type="hidden" name="sourceId" value={mode.sourceId} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium cf-text">Data e ora</label>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={
              defaults?.startsAt
                ? toDatetimeLocalValue(new Date(defaults.startsAt))
                : undefined
            }
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
            required={mode.kind !== "duplicate"}
          />
          <FieldError msg={e("startsAt")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Durata</label>
          <select
            name="durationMin"
            defaultValue={String(defaults?.durationMin ?? 60)}
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="75">75 min</option>
            <option value="90">90 min</option>
          </select>
          <FieldError msg={e("durationMin")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium cf-text">Tipo luogo</label>
          <select
            name="locationType"
            defaultValue={defaults?.locationType ?? "GYM"}
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          >
            <option value="GYM">Palestra</option>
            <option value="HOME">A domicilio</option>
            <option value="OUTDOOR">Outdoor</option>
            <option value="ONLINE">Online</option>
            <option value="OTHER">Altro</option>
          </select>
          <FieldError msg={e("locationType")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Luogo</label>
          <input
            name="location"
            defaultValue={defaults?.location ?? ""}
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
          <FieldError msg={e("location")} />
        </div>
      </div>

      {mode.kind === "edit" ? (
        <div>
          <label className="text-xs font-medium cf-text">Stato</label>
          <select
            name="status"
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          >
            <option value="SCHEDULED">Pianificata</option>
            <option value="COMPLETED">Completata</option>
            <option value="CANCELED">Cancellata</option>
          </select>

          {statusValue === "CANCELED" ? (
            <p className="mt-2 text-xs cf-faint">
              Sessione cancellata: il pagamento viene disattivato.
            </p>
          ) : null}

          <FieldError msg={e("status")} />
        </div>
      ) : null}

      <div className="rounded-3xl border cf-surface p-4">
        <div className="text-sm font-semibold cf-text">Pagamento</div>
        <p className="mt-1 text-xs cf-muted">Prezzo e stato pagamento.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium cf-text">Prezzo (€)</label>
            <input
              name="price"
              defaultValue={
                defaults?.priceCents != null
                  ? String((defaults.priceCents / 100).toFixed(2)).replace(
                      ".",
                      ","
                    )
                  : ""
              }
              className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
            />
            <FieldError msg={e("price")} />
          </div>

          <div>
            <label className="text-xs font-medium cf-text">Metodo</label>
            <select
              name="paymentMethod"
              defaultValue={defaults?.paymentMethod ?? ""}
              className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
            >
              <option value="">—</option>
              <option value="Contanti">Contanti</option>
              <option value="Carta">Carta</option>
              <option value="Bonifico">Bonifico</option>
              <option value="Altro">Altro</option>
            </select>
            <FieldError msg={e("paymentMethod")} />
          </div>

          <div className="pt-6">
            <div className="flex h-[42px] items-center gap-3 rounded-2xl border cf-surface px-4">
              <input
                id="isPaid"
                name="isPaid"
                type="checkbox"
                checked={isPaidChecked}
                onChange={(e) => setIsPaidChecked(e.target.checked)}
                disabled={mode.kind === "edit" && statusValue === "CANCELED"}
                className="h-4 w-4"
              />
              <label htmlFor="isPaid" className="text-sm cf-text">
                Pagata
              </label>
            </div>
            <FieldError msg={e("isPaid")} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium cf-text">Note</label>
        <textarea
          name="notes"
          defaultValue={defaults?.notes ?? ""}
          className="mt-2 min-h-[120px] w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
        />
        <FieldError msg={e("notes")} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button className="rounded-2xl bg-black px-5 py-2.5 text-sm text-white hover:opacity-90">
          {mode.kind === "edit"
            ? "Salva modifiche"
            : mode.kind === "duplicate"
            ? "Duplica"
            : "Crea sessione"}
        </button>
      </div>

      <FieldError msg={e("id")} />
      <FieldError msg={e("sourceId")} />
    </form>
  );
}
