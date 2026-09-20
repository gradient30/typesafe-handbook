import { ScrollText } from "lucide-react";
import { latestLog } from "@/lib/docs/sync-logs";
import { HandbookLink } from "./HandbookLink";

export function UpdateEntry() {
  const log = latestLog();
  const label = log ? log.capturedAt.slice(0, 10) : "—";
  const pending = (log?.changes ?? []).some((c) => c.kind === "modified" || c.kind === "added" || c.kind === "removed");
  return (
    <HandbookLink
      slug="sync-log"
      aria-label="打开同步日志"
      className="flex h-11 items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2.5 text-xs text-fg-subtle hover:border-border-strong hover:text-fg"
    >
      <ScrollText className="size-3.5 shrink-0" aria-hidden />
      <span className="hidden md:inline">同步</span>
      <span className="font-mono text-accent">{label}</span>
      {pending && log && log.changes[0]?.kind !== "baseline" ? (
        <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
      ) : null}
    </HandbookLink>
  );
}
