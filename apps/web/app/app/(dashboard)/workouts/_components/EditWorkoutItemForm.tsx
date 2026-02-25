"use client";

import { useMemo, useState } from "react";
import LoadsPerSet from "./LoadsPerSet";
import { updateWorkoutItem } from "../../../../../actions/workouts";

function numOrNull(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function Input({
  name,
  label,
  placeholder,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium cf-text">{label}</div>
      <input
        name={name}
        placeholder={placeholder}
        className="cf-input"
        defaultValue={value == null ? defaultValue : undefined}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

export default function EditWorkoutItemForm({
  itemId,
  sets: initialSets,
  reps,
  restSec,
  tempo,
  rpe,
  loadsKg,
  restSecBySet,
  itemNotes,
}: {
  itemId: string;
  sets: number | null;
  reps: string | null;
  restSec: number | null;
  tempo: string | null;
  rpe: number | null;
  loadsKg: number[] | null;
  restSecBySet: number[] | null;
  itemNotes: string | null;
}) {
  const [setsStr, setSetsStr] = useState(
    initialSets != null ? String(initialSets) : ""
  );
  const sets = useMemo(() => numOrNull(setsStr), [setsStr]);

  return (
    <form action={updateWorkoutItem} className="mt-3 grid gap-3">
      <input type="hidden" name="itemId" value={itemId} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Input
          name="sets"
          label="Serie"
          placeholder="4"
          value={setsStr}
          onChange={setSetsStr}
        />
        <Input name="reps" label="Reps" defaultValue={reps ?? ""} />

        <Input name="tempo" label="Tempo" defaultValue={tempo ?? ""} />
        <Input name="rpe" label="RPE" defaultValue={rpe ?? ""} />

        <div className="sm:col-span-6">
          <Input
            name="restSecBySet"
            label="Rec (per set)"
            defaultValue={(restSecBySet ?? []).join(", ")}
            placeholder="90, 75, 60, 60"
          />
          <LoadsPerSet
            sets={sets}
            name="loadsKg"
            defaultLoadsKg={loadsKg ?? undefined}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Note item</div>
        <textarea
          name="itemNotes"
          defaultValue={itemNotes ?? ""}
          className="cf-input min-h-[90px]"
        />
      </div>

      <div className="flex justify-end">
        <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
          Salva parametri
        </button>
      </div>
    </form>
  );
}
