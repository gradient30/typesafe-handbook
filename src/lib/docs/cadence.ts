import raw from "./cadence.json" with { type: "json" };

export type CadenceStatus = "current" | "stale" | "translating";

export type Cadence = {
  title: string;
  timezone: string;
  timeOfDay: string;
  fingerprint: string;
  translate: string;
  lastCheckAt: string;
  lastChangeAt: string;
  llmsHash: string;
  status: CadenceStatus;
};

export const CADENCE = raw as Cadence;

export function formatStamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ");
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} 北京时间`;
}
