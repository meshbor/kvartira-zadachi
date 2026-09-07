import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { packageRootDir } from "../config.ts";
import type { SourcesFile } from "./types.ts";

export async function loadSources(): Promise<SourcesFile> {
  const raw = await readFile(resolve(packageRootDir, "data/sources.json"), "utf8");
  const parsed = JSON.parse(raw) as SourcesFile;

  return {
    rss: parsed.rss ?? [],
    telegram: (parsed.telegram ?? []).filter((item) => item.username?.trim()),
    html: parsed.html ?? [],
  };
}
