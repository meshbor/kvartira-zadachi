import { cookies } from "next/headers";
import { QueueKiosk } from "@/components/queue-kiosk";
import { CLAIM_COOKIE, parseClaim } from "@/lib/queue/claim";
import { findTicket, getQueueView } from "@/lib/queue/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getQueueView();
  const claim = parseClaim((await cookies()).get(CLAIM_COOKIE)?.value);
  const claimed =
    claim?.day === initial.day
      ? (await findTicket(claim.code)).lookup?.ticket ?? null
      : null;
  return <QueueKiosk initial={initial} claimed={claimed} />;
}
