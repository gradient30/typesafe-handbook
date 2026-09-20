import { createFileRoute } from "@tanstack/react-router";
import { DocsShell } from "@/components/docs/DocsShell";

export const Route = createFileRoute("/docs/$")({ component: DocPage });

function DocPage() {
  const { _splat } = Route.useParams();
  const slug = (_splat ?? "introduction").replace(/\/$/, "");
  return <DocsShell slug={slug || "introduction"} />;
}
