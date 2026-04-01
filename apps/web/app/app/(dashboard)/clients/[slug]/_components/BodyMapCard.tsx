export const dynamic = "force-dynamic";
export const revalidate = 0;

import { listClientBodyIssues } from "@/actions/bodyIssues";
import BodyMapClient from "./BodyMapClient";

export default async function BodyMapCard({
  clientId,
  clientSlug,
}: {
  clientId: string;
  clientSlug: string;
}) {
  const issues = await listClientBodyIssues(clientId);

  return (
    <div className="cf-card rounded-[28px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
            Body map
          </div>
          <div className="mt-2 text-base font-semibold cf-text">
            Scheletro / problematiche
          </div>
          <p className="mt-1 text-sm cf-muted">
            Clicca una zona per aggiungere dolore/limitazioni.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <BodyMapClient
          clientId={clientId}
          clientSlug={clientSlug}
          initialIssues={issues}
        />
      </div>
    </div>
  );
}
