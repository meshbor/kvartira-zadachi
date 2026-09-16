import { cookies } from "next/headers";
import { OperatorLogin } from "@/components/operator-login";
import { OperatorWindow } from "@/components/operator-window";
import { OPERATOR_COOKIE, isOperatorCookie } from "@/lib/queue/auth";
import { getQueueView } from "@/lib/queue/store";

export const dynamic = "force-dynamic";

export default async function WindowPage() {
  const jar = await cookies();
  if (!isOperatorCookie(jar.get(OPERATOR_COOKIE)?.value)) {
    return <OperatorLogin />;
  }
  const initial = await getQueueView();
  return <OperatorWindow initial={initial} />;
}
