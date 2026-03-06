"use client";

import { useActionState } from "react";
import { useState } from "react";
import {
  createClientInviteAction,
  type CreateClientInviteState,
} from "./actions";

const initialState: CreateClientInviteState = {
  ok: false,
};

function getErrorMessage(error?: CreateClientInviteState["error"]) {
  switch (error) {
    case "INVALID_EMAIL":
      return "Inserisci un'email valida oppure lascia il campo vuoto.";
    case "INVALID_EXPIRES_IN_DAYS":
      return "La scadenza deve essere compresa tra 1 e 30 giorni.";
    case "UNAUTHORIZED":
      return "Devi effettuare l'accesso.";
    case "FORBIDDEN":
      return "Non hai i permessi per creare inviti.";
    case "INTERNAL_SERVER_ERROR":
      return "Si è verificato un errore imprevisto.";
    default:
      return null;
  }
}

export function InviteForm() {
  const [state, formAction, pending] = useActionState(
    createClientInviteAction,
    initialState
  );
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!state.inviteUrl) return;
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const errorMessage = getErrorMessage(state.error);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Email cliente (opzionale)
          </label>
          <input
            name="email"
            type="email"
            placeholder="cliente@email.com"
            className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          />
          <p className="mt-2 text-xs cf-muted">
            Se la inserisci, solo quell’email potrà accettare l’invito.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Scadenza invito
          </label>
          <select
            name="expiresInDays"
            defaultValue="7"
            className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          >
            <option value="3">3 giorni</option>
            <option value="7">7 giorni</option>
            <option value="14">14 giorni</option>
            <option value="30">30 giorni</option>
          </select>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Generazione..." : "Genera link invito"}
        </button>
      </form>

      {state.inviteUrl ? (
        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium">Link invito generato</p>

          <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm break-all dark:border-white/10 dark:bg-neutral-900/50">
            {state.inviteUrl}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-2xl border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              {copied ? "Copiato" : "Copia link"}
            </button>

            <a
              href={state.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-2xl border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              Apri anteprima
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}