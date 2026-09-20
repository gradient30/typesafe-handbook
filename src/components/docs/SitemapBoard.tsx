import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { pageBySlug } from "@/lib/docs/catalog";
import {
  MAP_SNAPSHOT,
  SECTION_META,
  compareDocs,
  officialHref,
  shortHash,
  type DocRow,
} from "@/lib/docs/official-map";
import { HandbookLink } from "./HandbookLink";

const DOC_STATUS: Record<DocRow["status"], { label: string; tone: string }> = {
  match: { label: "一致", tone: "border-border text-fg-subtle" },
  stale: { label: "待更新", tone: "border-accent text-accent" },
  added: { label: "新页", tone: "border-accent bg-accent/10 text-accent" },
  removed: { label: "官方已删", tone: "border-destructive text-destructive" },
  additive: { label: "加页", tone: "border-border text-fg-muted" },
};

export function SitemapBoard() {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const docs = useMemo(() => compareDocs(MAP_SNAPSHOT, null), []);
  const rows = onlyOpen ? docs.filter((r) => r.status !== "match" && r.status !== "additive") : docs;
  const officialCount = docs.filter((r) => r.kind === "official").length;
  const open = docs.filter((r) => r.status === "stale" || r.status === "added" || r.status === "removed").length;
  const grouped = SECTION_META.map((section) => ({
    ...section,
    rows: rows.filter((r) => r.section === section.id),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="mt-8 max-w-5xl" data-sitemap-board>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-bg-elevated px-3 py-3">
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">官网页</div>
          <div className="mt-1 font-display text-lg font-medium text-fg">{officialCount} 页</div>
        </div>
        <div className={cn("rounded-md border bg-bg-elevated px-3 py-3", open ? "border-accent" : "border-border")}>
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">待办</div>
          <div className="mt-1 font-display text-lg font-medium text-fg">{open === 0 ? "无" : `${open} 处`}</div>
        </div>
        <div className="rounded-md border border-border bg-bg-elevated px-3 py-3">
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">指纹日期</div>
          <div className="mt-1 font-display text-lg font-medium text-fg">{MAP_SNAPSHOT.capturedAt}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnlyOpen(false)}
          className={cn(
            "h-11 rounded-md border px-3 text-sm",
            !onlyOpen ? "border-fg bg-bg-subtle text-fg" : "border-border text-fg-muted hover:text-fg",
          )}
        >
          全部
        </button>
        <button
          type="button"
          onClick={() => setOnlyOpen(true)}
          className={cn(
            "h-11 rounded-md border px-3 text-sm",
            onlyOpen ? "border-fg bg-bg-subtle text-fg" : "border-border text-fg-muted hover:text-fg",
          )}
        >
          只看待办
        </button>
      </div>

      <h2 id="map-docs" className="mt-10 scroll-mt-24 border-b border-border pb-2 font-display text-xl font-semibold tracking-tight text-fg">
        手册页
      </h2>
      <p className="mt-3 text-sm leading-6 text-fg-muted">
        状态看内容哈希。官网 `.md` 一变，这一行变成「待更新」，旁边就是中文页位置和英文原文。
      </p>
      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-bg-subtle text-xs tracking-wide text-fg-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">分区</th>
              <th className="px-3 py-2 font-medium">手册</th>
              <th className="px-3 py-2 font-medium">Web 位置</th>
              <th className="px-3 py-2 font-medium">哈希</th>
              <th className="px-3 py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {grouped.flatMap((group) =>
              group.rows.map((row, i) => {
                const page = pageBySlug(row.slug);
                const tone = DOC_STATUS[row.status];
                return (
                  <tr key={row.slug} className="border-t border-border" data-slug={row.slug} data-status={row.status}>
                    <td className="px-3 py-2 align-top text-xs text-fg-subtle">{i === 0 ? group.title : ""}</td>
                    <td className="px-3 py-2 align-top">
                      <HandbookLink slug={row.slug} className="text-fg hover:text-accent">
                        {page?.title ?? row.slug}
                      </HandbookLink>
                      <div className="font-mono text-[11px] text-fg-subtle">{row.slug}</div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs leading-5 text-fg-muted">
                      {row.location}
                      {row.officialPath ? (
                        <div>
                          <a href={officialHref(row.officialPath)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            官网
                          </a>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-fg-muted">
                      {row.kind === "additive" ? "—" : shortHash(row.hash)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 font-mono text-[11px]", tone.tone)}>
                        {tone.label}
                      </span>
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>

      <h2 id="how-to" className="mt-10 scroll-mt-24 border-b border-border pb-2 font-display text-xl font-semibold tracking-tight text-fg">
        怎么用
      </h2>
      <p className="mt-3 text-sm leading-6 text-fg-muted">
        GitHub Actions 每 6 小时拉取 <span className="font-mono">docs.typesafe.ai/llms.txt</span> 和各页 Markdown，算出哈希。有差异就新增一条
        <HandbookLink slug="sync-log" className="text-accent hover:underline">
          同步日志
        </HandbookLink>
        ，写明改了哪一页、中文站在侧栏的哪一项。
      </p>
    </div>
  );
}
