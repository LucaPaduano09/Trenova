"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientAction, type CreateClientState } from "@/actions/clients";

const initialState: CreateClientState = {
  ok: false,
  error: {},
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export default function NewClientForm() {
  const router = useRouter();
  const [state, action] = useActionState(createClientAction, initialState);

  type ErrorKey = keyof NonNullable<
    Extract<CreateClientState, { ok: false }>["error"]
  >;

  const e = (key: ErrorKey) => (state.ok ? undefined : state.error?.[key]?.[0]);

  useEffect(() => {
    if (state?.ok && state?.client?.slug) {
      router.push(`/app/clients/${state.client.slug}`);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium cf-text">Nome e cognome</label>
          <input
            name="fullName"
            placeholder="Es. Mario Rossi"
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
            required
          />
          <FieldError msg={e("fullName")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Email</label>
          <input
            name="email"
            type="email"
            placeholder="mario@email.com"
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
          <FieldError msg={e("email")} />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Telefono</label>
          <input
            name="phone"
            placeholder="+39 ..."
            className="mt-2 w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
          <FieldError msg={e("phone")} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium cf-text">Note</label>
        <textarea
          name="notes"
          placeholder="Obiettivi, problematiche, info utili..."
          className="mt-2 min-h-[120px] w-full rounded-2xl border cf-surface px-4 py-2.5 text-sm outline-none focus:ring-2"
        />
        <FieldError msg={e("notes")} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs cf-faint">
          Il cliente verrà creato come{" "}
          <span className="font-medium">ACTIVE</span>.
        </div>
        <button className="rounded-2xl bg-black px-5 py-2.5 text-sm text-white hover:opacity-90">
          Crea cliente
        </button>
      </div>
    </form>
  );
}
