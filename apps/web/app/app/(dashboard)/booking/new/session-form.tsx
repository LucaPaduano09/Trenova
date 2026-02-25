"use client";

import { useActionState } from "react";
import { createSession } from "../../../../../actions/booking";

const initialState = {
  ok: true as const,
  error: {} as Record<string, string[]>,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export default function NewSessionForm({ clientSlug }: { clientSlug: string }) {
  const [state, action] = useActionState(createSession, initialState);
  const e = (key: string) => state?.error?.[key]?.[0];

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="clientSlug" value={clientSlug} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium cf-text">Data e ora</label>
          <input
            name="startsAt"
            type="datetime-local"
            className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
            required
          />
          <FieldError msg={e("startsAt")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Durata</label>
          <select
            name="durationMin"
            className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
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
            className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
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
          <label className="text-xs font-medium cf-text">
            Luogo (dettagli)
          </label>
          <input
            name="location"
            placeholder='Es. "Palestra X", "Parco Virgiliano"...'
            className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
          <FieldError msg={e("location")} />
        </div>
      </div>
      <div className="rounded-3xl border bg-white/60 p-4">
        <div className="text-sm font-semibold cf-text">Pagamento</div>
        <p className="mt-1 text-xs cf-muted">
          Inserisci il prezzo della sessione e indica se è stata già pagata.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium cf-text">Prezzo (€)</label>
            <input
              name="price"
              inputMode="decimal"
              placeholder="Es. 45 oppure 45,50"
              className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
            />
            <FieldError msg={e("price")} />
          </div>

          <div className="sm:col-span-1">
            <label className="text-xs font-medium cf-text">Metodo</label>
            <select
              name="paymentMethod"
              className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
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

          <div className="sm:col-span-1">
            <label className="text-xs font-medium cf-text">Stato</label>
            <div className="mt-2 flex h-[42px] items-center gap-3 rounded-2xl border bg-white/80 px-4">
              <input
                id="isPaid"
                name="isPaid"
                type="checkbox"
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
          placeholder="Obiettivo sessione, focus, eventuali note..."
          className="mt-2 min-h-[120px] w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2"
        />
        <FieldError msg={e("notes")} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs cf-faint">
          Verrà salvata come <span className="font-medium">Pianificata</span>.
        </div>
        <button className="rounded-2xl bg-black px-5 py-2.5 text-sm text-white hover:opacity-90">
          Crea sessione
        </button>
      </div>

      <FieldError msg={e("clientSlug")} />
    </form>
  );
}
