"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSession } from "../../../../../actions/booking";

const initialState = {
  ok: true as const,
  error: {} as Record<string, string[]>,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-700 dark:text-red-200">
      {msg}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={[
        "rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition",
        pending ? "bg-neutral-400 dark:bg-white/20 cursor-not-allowed" : "bg-black hover:opacity-90 dark:bg-white dark:text-neutral-900",
      ].join(" ")}
    >
      {pending ? "Creazione…" : "Crea sessione"}
    </button>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateTimeInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function NewSessionForm({ clientSlug }: { clientSlug: string }) {
  const [state, action] = useActionState(createSession, initialState);
  const e = (key: string) => state?.error?.[key]?.[0];

  const [defaultStartsAt, setDefaultStartsAt] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    setDefaultStartsAt(toLocalDateTimeInputValue(d));
  }, []);

  const hasAnyError = useMemo(() => {
    return Boolean(state?.error && Object.keys(state.error).length > 0);
  }, [state?.error]);

  return (
    <form action={action} className="space-y-5 cf-card">
      <input type="hidden" name="clientSlug" value={clientSlug} />

      {hasAnyError ? (
        <div className="rounded-3xl border px-4 py-3 text-sm cf-surface cf-hairline border-red-200/60 text-red-700 dark:border-red-500/20 dark:text-red-200">
          Controlla i campi evidenziati.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium cf-text">Data e ora</label>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={defaultStartsAt}
            className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
            required
          />
          <FieldError msg={e("startsAt")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Durata</label>
          <select
            name="durationMin"
            className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
            defaultValue="60"
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
            className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
            defaultValue="GYM"
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
          <label className="text-xs font-medium cf-text">Luogo (dettagli)</label>
          <input
            name="location"
            placeholder='Es. "Palestra X", "Parco Virgiliano"...'
            className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
          />
          <FieldError msg={e("location")} />
        </div>
      </div>

      <div className="rounded-3xl border cf-surface cf-hairline p-4">
        <div className="text-sm font-semibold cf-text">Pagamento</div>
        <p className="mt-1 text-xs cf-muted">
          Inserisci il prezzo della sessione e indica se è stata già pagata.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium cf-text">Prezzo (€)</label>
            <input
              name="price"
              inputMode="decimal"
              placeholder="Es. 45 oppure 45,50"
              className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
            />
            <FieldError msg={e("price")} />
          </div>

          <div>
            <label className="text-xs font-medium cf-text">Metodo</label>
            <select
              name="paymentMethod"
              className="mt-2 cf-input focus:ring-2 focus:ring-emerald-400/30"
              defaultValue=""
            >
              <option value="">—</option>
              <option value="Contanti">Contanti</option>
              <option value="Carta">Carta</option>
              <option value="Bonifico">Bonifico</option>
              <option value="Altro">Altro</option>
            </select>
            <FieldError msg={e("paymentMethod")} />
          </div>

          <div>
            <label className="text-xs font-medium cf-text">Stato</label>

            <label className="mt-2 flex items-center gap-3 rounded-2xl border cf-surface px-4 py-2.5 text-sm cf-text">
              <input
                id="isPaid"
                name="isPaid"
                type="checkbox"
                className="h-4 w-4 accent-emerald-500"
              />
              Pagata
            </label>

            <FieldError msg={e("isPaid")} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium cf-text">Note</label>
        <textarea
          name="notes"
          placeholder="Obiettivo sessione, focus, eventuali note..."
          className="mt-2 cf-input min-h-[120px] focus:ring-2 focus:ring-emerald-400/30"
        />
        <FieldError msg={e("notes")} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs cf-faint">
          Verrà salvata come <span className="font-medium cf-text">Pianificata</span>.
        </div>

        <SubmitButton />
      </div>

      <FieldError msg={e("clientSlug")} />
    </form>
  );
}