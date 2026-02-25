"use client";

import { useMemo, useState } from "react";
import LoadsPerSet from "./LoadsPerSet";
import { addWorkoutItem } from "../../../../../actions/workouts";
import RestPerSet from "./RestPerSet";

function numOrNull(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function Input({
  name,
  label,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
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
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

export default function AddWorkoutItemForm({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: { ref: string; name: string; kind: "custom" | "global" }[];
}) {
  const [setsStr, setSetsStr] = useState("");
  const sets = useMemo(() => numOrNull(setsStr), [setsStr]);

  return (
    <form action={addWorkoutItem} className="mt-4 grid gap-3">
      <input type="hidden" name="workoutId" value={workoutId} />

      <div className="grid gap-2">
        <div className="text-sm font-medium">Esercizio</div>
        <select name="ref" className="cf-input" required defaultValue="">
          <option value="" disabled>
            Seleziona…
          </option>
          {exercises.slice(0, 150).map((e) => (
            <option key={e.ref} value={e.ref}>
              {e.name} {e.kind === "custom" ? "(Custom)" : ""}
            </option>
          ))}
        </select>
        <div className="text-xs cf-faint">
          Mostro max 150 risultati (MVP). Poi facciamo picker serio live.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Input
          name="sets"
          label="Serie"
          placeholder="4"
          value={setsStr}
          onChange={setSetsStr}
        />
        <Input name="reps" label="Reps" placeholder="8-10" />
        <Input name="tempo" label="Tempo" placeholder="3-1-1" />
        <Input name="rpe" label="RPE" placeholder="8" />
        <div className="sm:col-span-6">
          <RestPerSet sets={Number(sets ?? 0)} defaultValue={[30, 40]} />
          <LoadsPerSet sets={sets} name="loadsKg" />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Note item</div>
        <textarea name="itemNotes" className="cf-input min-h-[90px]" />
      </div>

      <div className="flex justify-end">
        <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
          Aggiungi
        </button>
      </div>
    </form>
  );
}
