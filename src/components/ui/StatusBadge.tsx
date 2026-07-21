"use client";
import { Badge, type BadgeProps } from "./Badge";
import { cn } from "@/lib/utils";

// ─── Status Config Map ────────────────────────────────────────────────────────
export type NenkinStatus =
  | "DRAFT"
  | "SENT_1ST"
  | "RECEIVED_1ST"
  | "SENT_2ND"
  | "RECEIVED_2ND"
  | "COMPLETED"
  | "REJECTED"
  | "ON_HOLD"
  | string;

interface StatusConfig {
  label: string;
  variant: BadgeProps["variant"];
  dot?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Vietnamese keys (from DB)
  "Bản nháp":      { label: "Bản nháp",       variant: "warning",  dot: true  },
  "Đã nộp lần 1":  { label: "Đã nộp lần 1",   variant: "info",     dot: true  },
  "Đã nhận lần 1": { label: "Đã nhận lần 1",  variant: "info",     dot: false },
  "Đã nộp lần 2":  { label: "Đã nộp lần 2",   variant: "indigo",   dot: true  },
  "Đã nhận lần 2": { label: "Đã nhận lần 2",  variant: "indigo",   dot: false },
  "Hoàn thành":    { label: "Hoàn thành",      variant: "success",  dot: false },
  "Từ chối":       { label: "Từ chối",         variant: "error",    dot: false },
  "Tạm dừng":      { label: "Tạm dừng",        variant: "default",  dot: false },
  // English enum keys (fallback)
  DRAFT:           { label: "Bản nháp",        variant: "warning",  dot: true  },
  SENT_1ST:        { label: "Đã nộp lần 1",    variant: "info",     dot: true  },
  RECEIVED_1ST:    { label: "Đã nhận lần 1",   variant: "info",     dot: false },
  SENT_2ND:        { label: "Đã nộp lần 2",    variant: "indigo",   dot: true  },
  RECEIVED_2ND:    { label: "Đã nhận lần 2",   variant: "indigo",   dot: false },
  COMPLETED:       { label: "Hoàn thành",       variant: "success",  dot: false },
  REJECTED:        { label: "Từ chối",          variant: "error",    dot: false },
  ON_HOLD:         { label: "Tạm dừng",         variant: "default",  dot: false },
};

export interface StatusBadgeProps
  extends Omit<BadgeProps, "variant" | "dot" | "children"> {
  status: NenkinStatus;
  /** Override the display label */
  label?: string;
  /** Show as a larger pill in page headers */
  hero?: boolean;
}

/**
 * StatusBadge — automatically maps a Nenkin application status
 * to the correct Badge variant + label + dot indicator.
 *
 * Usage:
 *   <StatusBadge status={application.tien_do} />
 *   <StatusBadge status="COMPLETED" hero />
 */
export function StatusBadge({
  status,
  label,
  hero = false,
  className,
  size,
  ...props
}: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    variant: "default" as const,
    dot: false,
  };

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      size={size ?? (hero ? "lg" : "md")}
      className={cn(hero && "font-semibold tracking-wide", className)}
      {...props}
    >
      {label ?? config.label}
    </Badge>
  );
}

/** Utility: get variant for a status (for custom styling) */
export function getStatusVariant(status: NenkinStatus): BadgeProps["variant"] {
  return STATUS_MAP[status]?.variant ?? "default";
}

/** Utility: get display label for a status */
export function getStatusLabel(status: NenkinStatus): string {
  return STATUS_MAP[status]?.label ?? status;
}
