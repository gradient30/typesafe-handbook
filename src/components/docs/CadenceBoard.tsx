import { CADENCE, formatStamp } from "@/lib/docs/cadence";
import { cn } from "@/lib/cn";

const STATUS: Record<(typeof CADENCE)["status"], { label: string; tone: string }> = {
  current: { label: "与官网一致", tone: "border-border text-fg-muted" },
  stale: { label: "待重译", tone: "border-accent text-accent" },
  translating: { label: "正在汉化", tone: "border-accent bg-accent/10 text-accent" },
};

export function CadenceBoard() {
  const tone = STATUS[CADENCE.status];
  return (
    <div className="mt-6 max-w-5xl" data-cadence-board>
      <h2
        id="cadence"
        className="scroll-mt-24 border-b border-border pb-2 font-display text-xl font-semibold tracking-tight text-fg"
      >
        例行更新
      </h2>
      <p className="mt-3 text-sm leading-6 text-fg-muted">
        中文译本长期跟官网走：指纹对照不停，变动页每天重译一次，结果写进本页日志。
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-bg-elevated px-3 py-3">
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">节奏</div>
          <div className="mt-1 font-display text-lg font-medium text-fg">每天 {CADENCE.timeOfDay}</div>
          <div className="mt-1 text-xs text-fg-subtle">北京时间 · 永久汉化</div>
        </div>
        <div className="rounded-md border border-border bg-bg-elevated px-3 py-3">
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">上次对照</div>
          <div className="mt-1 font-display text-lg font-medium text-fg">{formatStamp(CADENCE.lastCheckAt)}</div>
          <div className="mt-1 font-mono text-xs text-fg-subtle">llms {CADENCE.llmsHash.slice(0, 8)}</div>
        </div>
        <div className={cn("rounded-md border bg-bg-elevated px-3 py-3", CADENCE.status === "stale" ? "border-accent" : "border-border")}>
          <div className="text-[11px] tracking-wide text-fg-subtle uppercase">译本</div>
          <div className="mt-1">
            <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 font-mono text-[11px]", tone.tone)}>
              {tone.label}
            </span>
          </div>
          <div className="mt-2 text-xs text-fg-subtle">6 小时指纹 · 每日重译</div>
        </div>
      </div>
    </div>
  );
}
