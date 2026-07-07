import type { ReactNode } from "react";
import type { SongStatus } from "@monorepo/core";
import type { CoverVariant } from "../lib/model";

const coverGradients: Record<Exclude<CoverVariant, "none">, string> = {
  warm: "linear-gradient(135deg,#2c2419,#3a2f20)",
  neutral: "linear-gradient(135deg,#22201c,#2b2823)",
  terracotta: "linear-gradient(135deg,#3a2a1c,#28201a)",
  sage: "linear-gradient(135deg,#23302a,#1c2620)",
  demos: "linear-gradient(135deg,#262320,#2e2a25)",
};

const statusDotColor: Record<SongStatus, string> = {
  finished: "#c25e44",
  in_progress: "#cf9b3f",
  draft: "#837a6e",
};

export function StatusDot({ status, size = 8 }: { status: SongStatus; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: statusDotColor[status] }}
    />
  );
}

const statusPillStyle: Record<SongStatus, { background: string; color: string }> = {
  finished: { background: "rgba(194,94,68,.16)", color: "#e08a72" },
  in_progress: { background: "rgba(207,155,63,.14)", color: "#cf9b3f" },
  draft: { background: "rgba(131,122,110,.14)", color: "#9b948a" },
};

export function StatusPill({ status, label }: { status: SongStatus; label: string }) {
  return (
    <span
      className="rounded-full px-[11px] py-[3px] font-mono text-[11px] font-semibold"
      style={statusPillStyle[status]}
    >
      {label}
    </span>
  );
}

/** Gradient cover placeholder. `variant: "none"` renders the dashed audio-only tile. */
export function CoverArt({
  variant,
  className = "",
  style,
  children,
}: {
  variant: CoverVariant;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}) {
  if (variant === "none") {
    return (
      <div
        className={`border border-dashed border-border-dashed bg-[#1a1610] ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={className} style={{ background: coverGradients[variant], ...style }}>
      {children}
    </div>
  );
}

/** Small bordered mono chip: "Tom · Lá", "92 BPM", "v2 · atual ▾" */
export function MetaChip({
  children,
  active = false,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`rounded-lg border px-[11px] py-[5px] font-mono text-xs ${
        active
          ? "border-border-active bg-surface-active text-ink"
          : "border-border-strong bg-surface-alt text-ink-3"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function TagChip({ children, dashed = false }: { children: ReactNode; dashed?: boolean }) {
  return (
    <span
      className={`rounded-md border px-2 py-[2px] text-[11px] ${
        dashed ? "border-dashed border-border-dashed text-faint" : "border-border-strong text-meta"
      }`}
    >
      {children}
    </span>
  );
}

export function MonoLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mono-label text-faint-2 ${className}`}>{children}</div>;
}

export function SavedIndicator({ label = "salvo" }: { label?: string }) {
  return (
    <span className="flex items-center gap-[7px] font-mono text-xs text-success">
      <span className="h-[6px] w-[6px] rounded-full bg-success" />
      {label}
    </span>
  );
}
