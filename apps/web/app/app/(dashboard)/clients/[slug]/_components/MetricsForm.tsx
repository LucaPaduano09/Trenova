"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import {
  createMetricsEntry,
} from "@/actions/metrics";
import {createMetricsInitialState,
  type CreateMetricsEntryState} from "@/actions/metrics.schema"
import { useRouter } from "next/navigation";

// usa i tuoi Field component (se è in scope), altrimenti importalo
// import Field from "./Field";

export default function MetricsForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState<CreateMetricsEntryState, FormData>(
    createMetricsEntry,
    createMetricsInitialState
  );

  useEffect(() => {
    if (!state.ok) return;

    const form = document.getElementById("metrics-form") as HTMLFormElement | null;
    form?.reset();
    router.refresh();
  }, [state, router]);

  return (
    <form id="metrics-form" action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="clientId" value={clientId} />

      {/* ✅ feedback globale */}
      <div className="text-xs">
        {state.ok ? (
          <span className="text-emerald-500">Salvato ✔</span>
        ) : state.error?.form?.[0] ? (
          <span className="text-rose-500">{state.error.form[0]}</span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Data/Ora" name="measuredAt" type="datetime-local" />
        <Field label="Peso (kg)" name="weightKg" placeholder="78,4" />
        <Field label="BF (%)" name="bodyFatPct" placeholder="21,5" />
      </div>

      <div className="mt-4 text-sm font-semibold cf-text">Misure</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Vita (cm)" name="waistCm" placeholder="82" />
        <Field label="Fianchi (cm)" name="hipsCm" placeholder="96" />
        <Field label="Braccio Dx (cm)" name="armRmm" placeholder="34" />
        <Field label="Braccio Sx (cm)" name="armLmm" placeholder="34" />
        <Field label="Avambraccio Dx (cm)" name="forearmRmm" placeholder="28" />
        <Field label="Avambraccio Sx (cm)" name="forearmLmm" placeholder="28" />
        <Field label="Coscia Dx (cm)" name="thighRmm" placeholder="58" />
        <Field label="Coscia Sx (cm)" name="thighLmm" placeholder="58" />
        <Field label="Polp. Dx (cm)" name="calfRmm" placeholder="40" />
        <Field label="Polp. Sx (cm)" name="calfLmm" placeholder="40" />
      </div>

      <div className="mt-4 text-sm font-semibold cf-text">BIA</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <Field label="TBW (%)" name="tbwPct" placeholder="54,2" />
        <Field label="ICW (%)" name="icwPct" placeholder="31,0" />
        <Field label="ECW (%)" name="ecwPct" placeholder="23,2" />
        <Field label="Phase angle" name="phaseAngle" placeholder="5,6" />
        <Field label="BMR (kcal)" name="bmrKcal" placeholder="1680" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <Field label="Muscolo (kg)" name="muscleKg" placeholder="32,1" />
        <Field label="Grasso (kg)" name="fatKg" placeholder="16,8" />
        <Field label="FFM (kg)" name="ffmKg" placeholder="61,6" />
        <Field label="Viscerale" name="visceralFat" placeholder="10" />
        <Field label="Età meta" name="metabolicAge" placeholder="28" />
      </div>

      <Field label="Note" name="notes" placeholder="Osservazioni..." textarea />

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90"
        >
          Salva check-in
        </button>
      </div>
    </form>
  );
}
function Field({
  label,
  name,
  placeholder,
  type = "text",
  textarea,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs cf-faint">{label}</div>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          className="w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text outline-none"
          rows={3}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className="w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text outline-none"
        />
      )}
    </label>
  );
}