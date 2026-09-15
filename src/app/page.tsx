import { Suspense } from "react";
import { Hub } from "@/components/hub";
import { emptyFamilyDigest, fetchFamilyDigest } from "@/lib/family/fetch-digest";
import { emptyDigest, fetchDigest } from "@/lib/news/fetch-digest";

export const revalidate = 1800;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [familyDigest, spacesDigest] = await Promise.all([
    fetchFamilyDigest().catch((error: unknown) =>
      emptyFamilyDigest(
        error instanceof Error ? error.message : "Не получилось собрать дайджест",
      ),
    ),
    fetchDigest().catch((error: unknown) =>
      emptyDigest(
        error instanceof Error ? error.message : "Не получилось собрать дайджест",
      ),
    ),
  ]);

  return (
    <Suspense>
      <Hub
        familyDigest={familyDigest}
        spacesDigest={spacesDigest}
        initialTab={tab}
      />
    </Suspense>
  );
}
