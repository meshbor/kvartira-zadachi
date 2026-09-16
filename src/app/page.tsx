import { QueueKiosk } from "@/components/queue-kiosk";
import { getQueueView } from "@/lib/queue/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getQueueView();
  return <QueueKiosk initial={initial} />;
}
