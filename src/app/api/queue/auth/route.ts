import { OPERATOR_COOKIE, isOperatorPassword, operatorCookieValue } from "@/lib/queue/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: Request) {
  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    password = "";
  }
  if (!isOperatorPassword(password)) {
    return Response.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    `${OPERATOR_COOKIE}=${operatorCookieValue()}; Path=${COOKIE_OPTIONS.path}; Max-Age=${COOKIE_OPTIONS.maxAge}; HttpOnly; SameSite=Lax${COOKIE_OPTIONS.secure ? "; Secure" : ""}`,
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    `${OPERATOR_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
  return response;
}
