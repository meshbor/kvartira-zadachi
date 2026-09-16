import { resetQueue } from "@/lib/queue/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const view = await resetQueue();
  return Response.json({ ok: true, view }, { headers: { "Cache-Control": "no-store" } });
}
