// ============================================================
// Central barrel export for all /ui components
// Last updated: B.15 TypeScript audit
// ============================================================

// ─ Button
export { Button, buttonVariants } from "./Button";
export type { ButtonProps } from "./Button";

// ─ Badge
export { Badge, badgeVariants } from "./Badge";
export type { BadgeProps } from "./Badge";

// ─ Status Badge
export { StatusBadge, getStatusVariant, getStatusLabel } from "./StatusBadge";
export type { StatusBadgeProps, NenkinStatus } from "./StatusBadge";

// ─ Select
export { Select, NativeSelect } from "./Select";
export type { SelectProps, NativeSelectProps, SelectOption } from "./Select";

// ─ WorkflowTimeline (B.13 — exports renamed)
export { WorkflowTimeline, NENKIN_WORKFLOW_STEPS } from "./WorkflowTimeline";
export type { WorkflowStep, WorkflowStepStatus } from "./WorkflowTimeline";

// ─ WorkflowPanel (B.13)
export { WorkflowPanel } from "../../../src/app/applications/[id]/WorkflowPanel";

// ─ TaxDiffPanel (B.14)
export { TaxDiffPanel } from "./TaxDiffPanel";
export type { TaxDiffPanelProps, DiffFieldConfig, DiffStatus } from "./TaxDiffPanel";

// ─ TaxOfficeDiffCard (legacy, kept for backward compat)
export { TaxOfficeDiffCard } from "./TaxOfficeDiffCard";
export type { DiffField } from "./TaxOfficeDiffCard";

// ─ Form components
export { FormField } from "./FormField";
export { Input } from "./Input";
export { DateInput } from "./DateInput";

// ─ Layout
export { Card } from "./Card";
export { Table } from "./Table";

// ─ Toast — use sonner directly in pages/components:
//   import { toast } from 'sonner'
//   import { Toaster } from 'sonner'
// Toast.tsx kept for legacy usage only, NOT re-exported here to avoid conflict.
