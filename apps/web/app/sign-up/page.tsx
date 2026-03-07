import { prisma } from "@/lib/db";
import { getValidClientInvite } from "@/lib/invites/getValidClientInvite";
import { SignUpInviteForm } from "./sign-up-invite-form";

type PageProps = {
  searchParams?: Promise<{
    inviteToken?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const qp = searchParams ? await searchParams : {};
  const inviteToken = qp.inviteToken?.trim() || "";

  if (!inviteToken) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="cf-card">
          <h1 className="text-xl font-semibold">Registrazione</h1>
          <p className="mt-2 text-sm cf-muted">
            Questa pagina di registrazione è riservata agli inviti cliente.
          </p>
        </div>
      </div>
    );
  }

  const validInvite = await getValidClientInvite(inviteToken);

  if (!validInvite.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="cf-card">
          <h1 className="text-xl font-semibold">Invito non valido</h1>
          <p className="mt-2 text-sm cf-muted">
            L’invito non è più disponibile o è scaduto.
          </p>
        </div>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: validInvite.invite.tenantId },
    select: {
      name: true,
      users: {
        where: { role: "OWNER" },
        select: {
          fullName: true,
          email: true,
        },
        take: 1,
      },
    },
  });

  const owner = tenant?.users[0] ?? null;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="cf-card">
        <p className="text-xs uppercase tracking-[0.22em] cf-muted">
          Trenova Invite
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          Crea il tuo account cliente
        </h1>

        <p className="mt-3 text-sm cf-muted">
          Ti stai registrando per collegarti al coach{" "}
          <span className="font-medium text-current">
            {owner?.fullName || tenant?.name || "Trenova"}
          </span>
          .
        </p>

        {validInvite.invite.email ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-white/10">
            Email invitata:{" "}
            <span className="font-medium text-current">
              {validInvite.invite.email}
            </span>
          </div>
        ) : null}

        <div className="mt-6">
          <SignUpInviteForm
            inviteToken={inviteToken}
            invitedEmail={validInvite.invite.email ?? ""}
          />
        </div>
      </div>
    </div>
  );
}