#!/usr/bin/env node
/**
 * Fetch https://docs.typesafe.ai/llms.txt and each .md page, hash them,
 * compare with src/lib/docs/official-map.json, and when something moved:
 * append a new entry to src/lib/docs/sync-logs.json describing WHAT changed
 * and WHERE it lives on this Chinese site.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mapFile = join(root, "src/lib/docs/official-map.json");
const logFile = join(root, "src/lib/docs/sync-logs.json");
const INDEX = "https://docs.typesafe.ai/llms.txt";
const ORIGIN = "https://docs.typesafe.ai/";

type DocFingerprint = {
  slug: string;
  section: string;
  kind: "official" | "additive";
  officialPath: string | null;
  size: number | null;
  hash: string | null;
  translatedAtHash: string | null;
};

type MapSnapshot = {
  capturedAt: string;
  source: string;
  llmsHash: string;
  docs: DocFingerprint[];
};

type SyncChange = {
  kind: "added" | "modified" | "removed" | "baseline";
  slug: string;
  title: string;
  officialUrl: string | null;
  handbookHref: string;
  location: string;
  prevHash: string | null;
  nextHash: string | null;
  note: string;
};

type SyncLog = {
  id: string;
  capturedAt: string;
  summary: string;
  llmsHash: string;
  changes: SyncChange[];
};

function sha12(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function todayIso(): string {
  return new Date().toISOString();
}

function parseIndex(text: string): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  const re = /\[([^\]]+)\]\((https:\/\/docs\.typesafe\.ai\/[^)]+\.md)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ title: m[1] ?? "", url: m[2] ?? "" });
  }
  return out;
}

function urlToSlug(url: string): string {
  return url.replace(ORIGIN, "").replace(/\.md$/, "");
}

function handbookHref(slug: string): string {
  return slug === "introduction" ? "/" : `/docs/${slug}`;
}

function locationOf(slug: string, title: string): string {
  if (slug.startsWith("introduction")) return `侧栏「入门」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("concepts/") || slug === "confidence") return `侧栏「TypeSafe 基础」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("primitives")) return `侧栏「原语」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("patterns")) return `侧栏「模式」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("demos")) return `侧栏「演示」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("sdk")) return `侧栏「SDK」→「${title}」· 本站 ${handbookHref(slug)}`;
  if (slug.startsWith("cookbooks")) return `侧栏「食谱」→「${title}」· 本站 ${handbookHref(slug)}`;
  return `侧栏「参考」→「${title}」· 本站 ${handbookHref(slug)}`;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "typesafe-handbook-sync" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return await res.text();
}

async function main() {
  const existing = JSON.parse(readFileSync(mapFile, "utf8")) as MapSnapshot;
  const logs = JSON.parse(readFileSync(logFile, "utf8")) as SyncLog[];
  const llms = await fetchText(INDEX);
  const llmsHash = sha12(llms);
  const listed = parseIndex(llms);

  const skipJsApi = (slug: string) => slug.startsWith("sdk/javascript/api/") && slug !== "sdk/javascript/api";

  const liveDocs: { slug: string; title: string; path: string; hash: string; size: number }[] = [];
  for (const item of listed) {
    const slug = urlToSlug(item.url);
    if (skipJsApi(slug)) continue;
    try {
      const body = await fetchText(item.url);
      liveDocs.push({
        slug,
        title: item.title,
        path: slug + ".md",
        hash: sha12(body),
        size: Buffer.byteLength(body),
      });
    } catch (err) {
      console.warn("skip", item.url, err);
    }
  }

  const bySlug = new Map(liveDocs.map((d) => [d.slug, d]));
  const nextDocs: DocFingerprint[] = existing.docs.map((doc) => {
    if (doc.kind !== "official") return doc;
    const live = bySlug.get(doc.slug);
    return {
      ...doc,
      hash: live?.hash ?? doc.hash,
      size: live?.size ?? doc.size,
    };
  });
  const known = new Set(nextDocs.map((d) => d.slug));
  for (const live of liveDocs) {
    if (known.has(live.slug)) continue;
    nextDocs.push({
      slug: live.slug,
      section: "other",
      kind: "official",
      officialPath: live.path,
      size: live.size,
      hash: live.hash,
      translatedAtHash: null,
    });
    known.add(live.slug);
  }

  const changes: SyncChange[] = [];
  for (const doc of nextDocs) {
    if (doc.kind !== "official") continue;
    const live = bySlug.get(doc.slug);
    const prev = existing.docs.find((d) => d.slug === doc.slug);
    if (!prev) {
      changes.push({
        kind: "added",
        slug: doc.slug,
        title: live?.title || doc.slug,
        officialUrl: `${ORIGIN}${doc.slug}`,
        handbookHref: handbookHref(doc.slug),
        location: locationOf(doc.slug, live?.title || doc.slug),
        prevHash: null,
        nextHash: doc.hash,
        note: "官网新增页面，中文站尚未翻译。",
      });
      continue;
    }
    if (live && prev.hash && live.hash !== prev.hash) {
      changes.push({
        kind: "modified",
        slug: doc.slug,
        title: live.title,
        officialUrl: `${ORIGIN}${doc.slug}`,
        handbookHref: handbookHref(doc.slug),
        location: locationOf(doc.slug, live.title),
        prevHash: prev.hash,
        nextHash: live.hash,
        note: "官网正文哈希变化，请核对对应中文页。",
      });
    }
    if (!live && prev.hash) {
      changes.push({
        kind: "removed",
        slug: doc.slug,
        title: doc.slug,
        officialUrl: `${ORIGIN}${doc.slug}`,
        handbookHref: handbookHref(doc.slug),
        location: locationOf(doc.slug, doc.slug),
        prevHash: prev.hash,
        nextHash: null,
        note: "官网索引里已经找不到这一页。",
      });
    }
  }

  const capturedAt = todayIso();
  const next: MapSnapshot = {
    capturedAt: capturedAt.slice(0, 10),
    source: INDEX,
    llmsHash,
    docs: nextDocs,
  };

  if (changes.length === 0 && llmsHash === existing.llmsHash) {
    console.log("up to date", llmsHash);
    return;
  }

  if (changes.length) {
    const id = capturedAt.slice(0, 16).replace(/[-:T]/g, "");
    const summary =
      changes.length === 1
        ? `${changes[0]?.title} 有更新`
        : `${changes.length} 处官网变动（新增 ${changes.filter((c) => c.kind === "added").length} / 改动 ${changes.filter((c) => c.kind === "modified").length} / 删除 ${changes.filter((c) => c.kind === "removed").length}）`;
    const log: SyncLog = { id, capturedAt, summary, llmsHash, changes };
    logs.unshift(log);
    writeFileSync(logFile, `${JSON.stringify(logs, null, 2)}\n`);
    console.log("logged", id, summary);
  }

  writeFileSync(mapFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log("wrote map", next.docs.length, "llms", llmsHash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
