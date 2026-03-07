"use client";

import { useActionState } from "react";
import { signUpWithInviteAction, type SignUpWithInviteState } from "./actions";

const initialState: SignUpWithInviteState = {
  ok: false,
};

function getErrorMessage(error?: SignUpWithInviteState["error"]) {
  switch (error) {
    case "INVALID_NAME":
      return "Inserisci un nome valido.";
    case "INVALID_EMAIL":
      return "Inserisci un'email valida.";
    case "INVALID_PASSWORD":
      return "La password deve avere almeno 8 caratteri.";
    case "EMAIL_ALREADY_USED":
      return "Esiste già un account con questa email.";
    case "USER_NOT_FOUND":
      return "Utente non trovato.";
    case "INVITE_NOT_FOUND":
      return "Invito non trovato.";
    case "INVITE_REVOKED":
      return "Questo invito è stato revocato.";
    case "INVITE_ALREADY_USED":
      return "Questo invito è già stato utilizzato.";
    case "INVITE_EXPIRED":
      return "Questo invito è scaduto.";
    case "INVITE_EMAIL_MISMATCH":
      return "Questa email non corrisponde a quella invitata.";
    case "USER_ALREADY_IN_OTHER_TENANT":
      return "Questo account è già associato a un altro coach.";
    case "INTERNAL_SERVER_ERROR":
      return "Si è verificato un errore imprevisto.";
    default:
      return null;
  }
}

export function SignUpInviteForm({
  inviteToken,
  invitedEmail,
}: {
  inviteToken: string;
  invitedEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(
    signUpWithInviteAction,
    initialState
  );

  const errorMessage = getErrorMessage(state.error);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="inviteToken" value={inviteToken} />

      <div>
        <label className="mb-1 block text-sm font-medium">Nome completo</label>
        <input
          name="fullName"
          type="text"
          required
          className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          placeholder="Mario Rossi"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={invitedEmail}
          readOnly={!!invitedEmail}
          className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 disabled:opacity-70"
          placeholder="mario@email.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          placeholder="Almeno 8 caratteri"
        />
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
        {pending ? "Creazione account..." : "Crea account cliente"}
      </button>
    </form>
  );
}