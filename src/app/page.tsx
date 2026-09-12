import { DigestApp } from "@/components/digest-app";
import { emptyDigest, fetchDigest } from "@/lib/news/fetch-digest";

export const revalidate = 1800;

export default async function Home() {
  const digest = await fetchDigest().catch((error: unknown) =>
    emptyDigest(
      error instanceof Error ? error.message : "Не получилось собрать дайджест",
    ),
  );

  return <DigestApp initialDigest={digest} />;
}
