import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { acceptClientInviteAndRedirect } from "./actions";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "UNAUTHORIZED":
      return "Devi accedere prima di poter accettare l’invito.";
    case "INVITE_NOT_FOUND":
      return "Invito non trovato.";
    case "INVITE_REVOKED":
      return "Questo invito è stato revocato.";
    case "INVITE_ALREADY_USED":
      return "Questo invito è già stato utilizzato.";
    case "INVITE_EXPIRED":
      return "Questo invito è scaduto.";
    case "INVITE_EMAIL_MISMATCH":
      return "Hai effettuato l’accesso con un’email diversa da quella invitata.";
    case "USER_ALREADY_IN_OTHER_TENANT":
      return "Sei già associato a un altro coach.";
    case "INTERNAL_SERVER_ERROR":
      return "Si è verificato un errore imprevisto.";
    default:
      return null;
  }
}

export default async function InvitePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const qp = searchParams ? await searchParams : {};
  const session = await auth();

  const invite = await prisma.clientInvite.findUnique({
    where: { token },
  });

  if (!invite) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: invite.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      users: {
        where: { role: "OWNER" },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
        take: 1,
      },
    },
  });

  if (!tenant) notFound();

  const owner = tenant.users[0] ?? null;

  const isExpired = !!invite.expiresAt && invite.expiresAt < new Date();
  const isRevoked = !!invite.revokedAt;
  const isUsed = !!invite.usedAt;

  const isValid = !isExpired && !isRevoked && !isUsed;

  const errorMessage = getErrorMessage(qp.error);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-xl">
        <div className="cf-card">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] cf-muted">
              Trenova Invite
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Invito a collegarti con il tuo coach
            </h1>
            <p className="mt-3 text-sm cf-muted">
              Stai per collegare il tuo account al coach{" "}
              <span className="font-medium text-current">
                {owner?.fullName || tenant.name}
              </span>
              .
            </p>
          </div>

          <div className="cf-soft p-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="cf-muted">Coach / studio:</span>{" "}
                <span className="font-medium text-current">{tenant.name}</span>
              </div>

              {owner?.email ? (
                <div>
                  <span className="cf-muted">Email coach:</span>{" "}
                  <span className="font-medium text-current">
                    {owner.email}
                  </span>
                </div>
              ) : null}

              {invite.email ? (
                <div>
                  <span className="cf-muted">Invito destinato a:</span>{" "}
                  <span className="font-medium text-current">
                    {invite.email}
                  </span>
                </div>
              ) : null}

              {invite.expiresAt ? (
                <div>
                  <span className="cf-muted">Scadenza:</span>{" "}
                  <span className="font-medium text-current">
                    {invite.expiresAt.toLocaleString("it-IT")}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!isValid ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm dark:border-white/10 dark:bg-white/5">
              {isUsed && "Questo invito è già stato utilizzato."}
              {isRevoked && "Questo invito è stato revocato dal coach."}
              {isExpired && "Questo invito è scaduto."}
            </div>
          ) : !session?.user?.id ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm cf-muted">
                Per accettare l’invito devi prima accedere al tuo account.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/app/sign-in?callbackUrl=${encodeURIComponent(
                    `/invite/${token}`
                  )}`}
                  className="inline-flex items-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
                >
                  Accedi
                </Link>

                <Link
                  href={`/app/sign-up?inviteToken=${encodeURIComponent(token)}`}
                  className="inline-flex items-center rounded-2xl border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Registrati
                </Link>
              </div>
            </div>
          ) : (
            <form
              action={async () => {
                "use server";
                await acceptClientInviteAndRedirect(token);
              }}
              className="mt-6"
            >
              <button
                type="submit"
                className="inline-flex items-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
              >
                Accetta invito
              </button>

              <p className="mt-3 text-xs cf-muted">
                Accettando l’invito verrai associato a questo coach. Con l’MVP
                attuale puoi avere un solo PT attivo alla volta.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
