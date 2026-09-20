import { SYNC_LOGS, type SyncChange, type SyncLog } from "@/lib/docs/sync-logs";
import { cn } from "@/lib/cn";
import { HandbookLink } from "./HandbookLink";

const KIND: Record<SyncChange["kind"], { label: string; tone: string }> = {
  baseline: { label: "首次全量", tone: "border-border text-fg-subtle" },
  added: { label: "新增", tone: "border-accent bg-accent/10 text-accent" },
  modified: { label: "改动", tone: "border-accent text-accent" },
  removed: { label: "删除", tone: "border-destructive text-destructive" },
};

function Pill({ kind }: { kind: SyncChange["kind"] }) {
  const t = KIND[kind];
  return (
    <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 font-mono text-[11px] leading-4", t.tone)}>
      {t.label}
    </span>
  );
}

function ChangeRow({ change }: { change: SyncChange }) {
  const internal = change.handbookHref.startsWith("/docs/") || change.handbookHref === "/";
  return (
    <tr className="border-t border-border" data-slug={change.slug} data-kind={change.kind}>
      <td className="px-3 py-2 align-top">
        <Pill kind={change.kind} />
      </td>
      <td className="px-3 py-2 align-top">
        {internal ? (
          <HandbookLink slug={change.slug} className="text-fg hover:text-accent">
            {change.title}
          </HandbookLink>
        ) : (
          <span>{change.title}</span>
        )}
        <div className="font-mono text-[11px] text-fg-subtle">{change.slug}</div>
      </td>
      <td className="px-3 py-2 align-top text-xs leading-5 text-fg-muted">{change.location}</td>
      <td className="px-3 py-2 align-top text-xs text-fg-muted">{change.note}</td>
    </tr>
  );
}

function LogCard({ log, featured }: { log: SyncLog; featured?: boolean }) {
  return (
    <section
      className={cn("mt-6 rounded-md border bg-bg-elevated", featured ? "border-accent" : "border-border")}
      data-log-id={log.id}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="font-mono text-xs text-fg-subtle">{log.id}</div>
          <h3 className="mt-0.5 text-base font-medium text-fg">{log.summary}</h3>
        </div>
        <div className="text-xs text-fg-subtle">
          {log.capturedAt.replace("T", " ").slice(0, 16)} UTC
          <span className="ml-2 font-mono">llms {log.llmsHash.slice(0, 8)}</span>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-bg-subtle text-xs tracking-wide text-fg-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">类型</th>
              <th className="px-3 py-2 font-medium">改了什么</th>
              <th className="px-3 py-2 font-medium">在 Web 哪个位置</th>
              <th className="px-3 py-2 font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            {log.changes.map((c, i) => (
              <ChangeRow key={`${c.slug}-${i}`} change={c} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SyncLogBoard() {
  const [latest, ...rest] = SYNC_LOGS;
  return (
    <div className="mt-8 max-w-5xl" data-sync-log-board>
      {latest ? (
        <div>
          <h2 id="latest" className="scroll-mt-24 border-b border-border pb-2 font-display text-xl font-semibold tracking-tight text-fg">
            最近一次
          </h2>
          <LogCard log={latest} featured />
        </div>
      ) : (
        <p className="mt-4 text-sm text-fg-subtle">还没有同步记录。</p>
      )}
      <h2 id="history" className="mt-10 scroll-mt-24 border-b border-border pb-2 font-display text-xl font-semibold tracking-tight text-fg">
        历史记录
      </h2>
      {rest.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">这是第一次全量汉化。官网再改动时，这里会多出一条独立日志。</p>
      ) : (
        rest.map((log) => <LogCard key={log.id} log={log} />)
      )}
    </div>
  );
}
