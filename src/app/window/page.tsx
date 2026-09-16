import { OperatorWindow } from "@/components/operator-window";
import { getQueueView } from "@/lib/queue/store";

export const dynamic = "force-dynamic";

export default async function WindowPage() {
  const initial = await getQueueView();
  return <OperatorWindow initial={initial} />;
}
