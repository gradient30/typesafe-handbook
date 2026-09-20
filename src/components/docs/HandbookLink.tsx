import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function slugFromHref(href: string): string {
  if (!href || href === "/" || href === "/introduction") return "introduction";
  return href.replace(/^\/docs\//, "").replace(/^\//, "").replace(/\/$/, "") || "introduction";
}

export function HandbookLink({
  slug,
  href,
  className,
  children,
  onClick,
  hash,
  "aria-label": ariaLabel,
}: {
  slug?: string;
  href?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  hash?: string;
  "aria-label"?: string;
}) {
  const key = (slug ?? (href ? slugFromHref(href) : "introduction")).replace(/\/$/, "");
  if (key === "introduction" || key === "index" || key === "") {
    return (
      <Link to="/" hash={hash} className={className} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/docs/$"
      params={{ _splat: key }}
      hash={hash}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
