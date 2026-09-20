const files = import.meta.glob("../../content/zh/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function normalize(path: string): string {
  const marker = "/content/zh/";
  const i = path.indexOf(marker);
  const rel = i >= 0 ? path.slice(i + marker.length) : path;
  return rel.replace(/\.md$/, "").replace(/\\/g, "/");
}

const bySlug = new Map<string, string>();
for (const [path, body] of Object.entries(files)) {
  bySlug.set(normalize(path), body);
}

function titleOf(body: string, slug: string): string {
  const line = body.split("\n").find((l) => l.startsWith("# "));
  return (line?.slice(2) ?? slug).replace(/\s+\{#[^}]+\}\s*$/, "").trim();
}

export function getMarkdown(slug: string): string | undefined {
  const key = slug === "" || slug === "docs" || slug === "index" ? "introduction" : slug;
  return bySlug.get(key);
}

export type SearchHit = {
  slug: string;
  titleLine: string;
  snippet: string;
  hash?: string;
};

export function searchDocs(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const mdHits: SearchHit[] = [];
  for (const [slug, body] of bySlug) {
    const stripped = body.replace(/\s+\{#[A-Za-z0-9_-]+\}/g, "").replace(/\*\*/g, "");
    const lower = stripped.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx < 0 && !slug.toLowerCase().includes(q) && !titleOf(body, slug).toLowerCase().includes(q)) continue;
    const start = Math.max(0, idx < 0 ? 0 : idx - 40);
    const snippet = stripped.slice(start, start + 140).replace(/\n/g, " ");
    mdHits.push({ slug, titleLine: titleOf(body, slug), snippet });
  }
  return mdHits.slice(0, 24);
}
