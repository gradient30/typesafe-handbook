import raw from "./sync-logs.json" with { type: "json" };

export type SyncChange = {
  kind: "added" | "modified" | "removed" | "baseline" | "check" | "translated";
  slug: string;
  title: string;
  officialUrl: string | null;
  handbookHref: string;
  location: string;
  prevHash: string | null;
  nextHash: string | null;
  note: string;
};

export type SyncLog = {
  id: string;
  capturedAt: string;
  summary: string;
  llmsHash: string;
  changes: SyncChange[];
};

export const SYNC_LOGS = raw as SyncLog[];

export function latestLog(): SyncLog | undefined {
  return SYNC_LOGS[0];
}
