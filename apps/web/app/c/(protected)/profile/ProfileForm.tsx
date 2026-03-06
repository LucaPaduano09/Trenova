"use client";

import { useActionState } from "react";
import {
  updateClientProfile,
  type UpdateClientProfileState,
} from "@/actions/clientProfile";

type Props = {
  initialValues: {
    fullName: string;
    email: string;
    phone: string;
    sex: "" | "MALE" | "FEMALE" | "OTHER";
    heightCm: string;
    birthDate: string;
    hasTenant: boolean;
  };
};

const initialState: UpdateClientProfileState = {
  ok: false,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-white/75">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.06]";

export default function ProfileForm({ initialValues }: Props) {
  const [state, formAction, pending] = useActionState(
    updateClientProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome completo">
          <input
            name="fullName"
            defaultValue={initialValues.fullName}
            className={inputClassName}
            placeholder="Nome e cognome"
            required
          />
        </Field>

        <Field label="Email">
          <input
            value={initialValues.email}
            readOnly
            disabled
            className={`${inputClassName} cursor-not-allowed opacity-60`}
          />
        </Field>

        <Field label="Telefono">
          <input
            name="phone"
            defaultValue={initialValues.phone}
            className={inputClassName}
            placeholder="Es. +39 333 1234567"
          />
        </Field>

        <Field label="Sesso">
          <select
            name="sex"
            defaultValue={initialValues.sex}
            className={inputClassName}
          >
            <option value="">Seleziona</option>
            <option value="MALE">Uomo</option>
            <option value="FEMALE">Donna</option>
            <option value="OTHER">Altro</option>
          </select>
        </Field>

        <Field label="Altezza (cm)">
          <input
            name="heightCm"
            defaultValue={initialValues.heightCm}
            className={inputClassName}
            placeholder="Es. 178"
            inputMode="decimal"
          />
        </Field>

        <Field label="Data di nascita">
          <input
            name="birthDate"
            type="date"
            defaultValue={initialValues.birthDate}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="text-sm text-white/55">Stato collegamento trainer</div>
        <div className="mt-2 text-base font-medium text-white">
          {initialValues.hasTenant
            ? "Collegato a un trainer"
            : "Nessun trainer collegato"}
        </div>
        <p className="mt-2 text-sm leading-6 text-white/45">
          {initialValues.hasTenant
            ? "Il tuo profilo è già associato a un workspace Trenova."
            : "Potrai collegarti a un personal trainer tramite invito o scelta autonoma."}
        </p>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      {state.ok && state.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {state.success}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Salvataggio..." : "Salva profilo"}
        </button>
      </div>
    </form>
  );
}