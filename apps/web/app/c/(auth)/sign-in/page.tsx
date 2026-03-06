import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthCard from "@/app/app/_components/AuthCard";
import Link from "next/link";
import {prisma} from "@/lib/db"

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignInClientPage() {
  const session = await auth();

  if (session?.user?.id && session.user.role === "CLIENT") {
    const linkedClient = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (linkedClient) {
      redirect("/c");
    }
  }

  if (session?.user?.role === "OWNER") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="text-xl font-semibold">Sei già autenticato come PT</h1>
          <p className="mt-2 text-sm text-white/70">
            Per accedere come cliente nello stesso browser devi prima uscire dall’account PT.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/app"
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black"
            >
              Vai alla dashboard PT
            </Link>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/c/sign-in?mode=login" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium"
              >
                Esci e accedi come cliente
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AuthCard variant="client" defaultCallbackUrl="/c" />;
}