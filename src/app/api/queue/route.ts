import { findTicket, getQueueView, inviteNextVisitor, takeTicket } from "@/lib/queue/store";
import { OPERATOR_COOKIE, isOperatorCookie } from "@/lib/queue/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const result = await findTicket(code);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  }
  const view = await getQueueView();
  return Response.json({ view }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let name = "";
  try {
    const body = (await request.json()) as { name?: string; action?: string };
    if (body.action === "next") {
      const jar = await cookies();
      if (!isOperatorCookie(jar.get(OPERATOR_COOKIE)?.value)) {
        return Response.json({ error: "Нужен пароль окна" }, { status: 401 });
      }
      const view = await inviteNextVisitor();
      return Response.json({ view }, { headers: { "Cache-Control": "no-store" } });
    }
    name = body.name ?? "";
  } catch {
    name = "";
  }
  try {
    const result = await takeTicket(name);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выдать талон";
    return Response.json({ error: message }, { status: 409 });
  }
}
