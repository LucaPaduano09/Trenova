import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import ProfileForm from "./ProfileForm";

function toBirthDateInput(date?: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function ClientProfilePage() {
  const { client, hasTenant } = await getCurrentClient();

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
          Profilo Cliente
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
          I tuoi dati
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          Completa e aggiorna il tuo profilo personale. Queste informazioni
          aiuteranno Trenova e il tuo trainer a offrirti un percorso più adatto
          a te.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <ProfileForm
          initialValues={{
            fullName: client.fullName || "",
            email: client.email || "",
            phone: client.phone || "",
            sex:
              client.profile?.sex === "MALE" ||
              client.profile?.sex === "FEMALE" ||
              client.profile?.sex === "OTHER"
                ? client.profile.sex
                : "",
            heightCm: client.profile?.heightMm
              ? String(client.profile.heightMm / 10)
              : "",
            birthDate: toBirthDateInput(client.profile?.birthDate),
            hasTenant,
          }}
        />
      </section>
    </div>
  );
}