import raw from "./official-map.json" with { type: "json" };
import { PAGES, handbookHref, officialHref as officialSiteHref, webLocation } from "./catalog";

export type DocKind = "official" | "additive";

export type DocFingerprint = {
  slug: string;
  section: string;
  kind: DocKind;
  officialPath: string | null;
  size: number | null;
  hash: string | null;
  translatedAtHash: string | null;
};

export type MapSnapshot = {
  capturedAt: string;
  source: string;
  llmsHash: string;
  docs: DocFingerprint[];
};

export const MAP_SNAPSHOT = raw as MapSnapshot;

export const SECTION_META: { id: string; title: string }[] = [
  { id: "additive", title: "本站加页" },
  { id: "start", title: "入门" },
  { id: "foundations", title: "TypeSafe 基础" },
  { id: "primitives", title: "原语" },
  { id: "patterns", title: "模式" },
  { id: "demos", title: "演示" },
  { id: "sdk", title: "SDK" },
  { id: "reference", title: "参考" },
  { id: "cookbooks", title: "食谱" },
  { id: "other", title: "未分区" },
];

export type DocStatus = "match" | "stale" | "added" | "removed" | "additive";

export type DocRow = {
  slug: string;
  section: string;
  kind: DocKind;
  officialPath: string | null;
  liveHash: string | null;
  hash: string | null;
  translatedAtHash: string | null;
  size: number | null;
  status: DocStatus;
  location: string;
};

export function sectionOf(slug: string): string {
  if (slug === "sync-log" || slug === "sitemap" || slug === "architecture" || slug === "cookbooks") return "additive";
  if (slug === "introduction" || slug.startsWith("introduction/")) return "start";
  if (slug.startsWith("concepts/") || slug === "confidence") return "foundations";
  if (slug === "primitives" || slug.startsWith("primitives/")) return "primitives";
  if (slug === "patterns" || slug.startsWith("patterns/")) return "patterns";
  if (slug === "demos" || slug.startsWith("demos/")) return "demos";
  if (slug === "sdk" || slug.startsWith("sdk/")) return "sdk";
  if (slug === "models" || slug === "api" || slug === "agent-skill" || slug === "legal" || slug.startsWith("model-jaggedness/"))
    return "reference";
  if (slug.startsWith("cookbooks/")) return "cookbooks";
  return "other";
}

export function officialHref(path: string | null): string {
  if (!path) return "https://docs.typesafe.ai";
  return officialSiteHref(path);
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  return hash.slice(0, 8);
}

export function compareDocs(
  snapshot: MapSnapshot,
  live: { slug: string; hash: string; size: number; officialPath: string }[] | null,
): DocRow[] {
  const liveBySlug = new Map((live ?? []).map((d) => [d.slug, d]));
  const rows: DocRow[] = [];
  const seen = new Set<string>();

  for (const doc of snapshot.docs) {
    seen.add(doc.slug);
    if (doc.kind === "additive") {
      rows.push({
        slug: doc.slug,
        section: doc.section,
        kind: "additive",
        officialPath: null,
        liveHash: null,
        hash: null,
        translatedAtHash: null,
        size: null,
        status: "additive",
        location: webLocation(doc.slug),
      });
      continue;
    }
    const liveDoc = live ? liveBySlug.get(doc.slug) : undefined;
    const compareHash = liveDoc?.hash ?? doc.hash;
    let status: DocStatus;
    if (live && !liveDoc) status = "removed";
    else if (!doc.translatedAtHash) status = "stale";
    else if (compareHash && compareHash !== doc.translatedAtHash) status = "stale";
    else status = "match";
    rows.push({
      slug: doc.slug,
      section: doc.section,
      kind: "official",
      officialPath: doc.officialPath,
      liveHash: liveDoc?.hash ?? null,
      hash: doc.hash,
      translatedAtHash: doc.translatedAtHash,
      size: liveDoc?.size ?? doc.size,
      status,
      location: webLocation(doc.slug),
    });
  }

  if (live) {
    for (const item of live) {
      if (seen.has(item.slug)) continue;
      rows.push({
        slug: item.slug,
        section: sectionOf(item.slug),
        kind: "official",
        officialPath: item.officialPath,
        liveHash: item.hash,
        hash: null,
        translatedAtHash: null,
        size: item.size,
        status: "added",
        location: webLocation(item.slug),
      });
    }
  }

  const sectionRank = new Map(SECTION_META.map((s, i) => [s.id, i]));
  return rows.sort((a, b) => {
    const sa = sectionRank.get(a.section) ?? 99;
    const sb = sectionRank.get(b.section) ?? 99;
    if (sa !== sb) return sa - sb;
    return a.slug.localeCompare(b.slug);
  });
}

export function knownOfficialSlugs(): string[] {
  return PAGES.filter((p) => p.official).map((p) => p.slug);
}

export { handbookHref };
