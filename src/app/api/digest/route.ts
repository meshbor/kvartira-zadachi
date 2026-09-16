import { emptyDigest, fetchDigest } from "@/lib/news/fetch-digest";

export const revalidate = 1800;

export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.has("fresh");
  try {
    return Response.json(await fetchDigest(new Date(), fresh));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не получилось собрать дайджест";
    return Response.json(emptyDigest(message));
  }
}
