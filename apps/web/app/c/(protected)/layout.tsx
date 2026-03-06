import { ReactNode } from "react";
import { getCurrentClient } from "@/lib/auth/getCurrentClient";

export default async function ClientProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { client } = await getCurrentClient();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="font-semibold text-lg">Trenova</div>
          <div className="text-sm text-white/70">{client.fullName}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}