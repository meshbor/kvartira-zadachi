import { emptyFamilyDigest, fetchFamilyDigest } from "@/lib/family/fetch-digest";

export const revalidate = 1800;

export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.has("fresh");
  try {
    return Response.json(await fetchFamilyDigest(new Date(), fresh));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не получилось собрать дайджест";
    return Response.json(emptyFamilyDigest(message));
  }
}
