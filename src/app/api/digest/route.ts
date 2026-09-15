import { emptyDigest, fetchDigest } from "@/lib/news/fetch-digest";

export const revalidate = 1800;

export async function GET() {
  try {
    return Response.json(await fetchDigest());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не получилось собрать дайджест";
    return Response.json(emptyDigest(message));
  }
}
