"use client";
/**
 * Select.tsx — B.9
 *
 * Exports two components:
 *
 * 1. <Select>          — Headless custom dropdown (no external lib needed)
 *                        Full keyboard navigation, portal-ready, accessible.
 *
 * 2. <NativeSelect>    — Styled wrapper around <select> for simple use-cases
 *                        (react-hook-form, server-side filtering, etc.)
 *
 * Both are styled 100% consistent with <Input> and <Button> from the design system.
 */
import {
  createContext,
  useContext,
  useRef,
  useState,
  useId,
  useEffect,
  useCallback,
  forwardRef,
  type ReactNode,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// ─── Shared trigger variants (reused by both Select & NativeSelect) ───────────
const triggerVariants = cva(
  [
    "flex w-full items-center justify-between gap-2",
    "rounded-md border bg-transparent px-3 text-sm",
    "shadow-sm transition-colors placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-1 focus:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-7  text-xs",
        md: "h-9  text-sm",
        lg: "h-11 text-base",
      },
      state: {
        default: "border-input hover:border-ring/50",
        error:   "border-red-400 focus:ring-red-400",
        success: "border-emerald-400",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface SelectContextValue {
  value: string;
  onChange: (val: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerId: string;
  listboxId: string;
}
const SelectContext = createContext<SelectContextValue | null>(null);
function useSelectCtx() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("<SelectItem> must be inside <Select>");
  return ctx;
}

// ─── 1. Custom <Select> ───────────────────────────────────────────────────────
export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: VariantProps<typeof triggerVariants>["size"];
  state?: VariantProps<typeof triggerVariants>["state"];
  /** Render selected option as a custom node */
  renderSelected?: (option: SelectOption | undefined) => ReactNode;
}

export function Select({
  value: controlledValue,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  size = "md",
  state = "default",
  renderSelected,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const triggerId = `sel-trigger-${id}`;
  const listboxId = `sel-listbox-${id}`;

  const selected = options.find(o => o.value === value);
  const enabledOptions = options.filter(o => !o.disabled);

  const handleSelect = useCallback(
    (val: string) => {
      setInternalValue(val);
      onChange?.(val);
      setOpen(false);
      setFocusedIdx(-1);
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && focusedIdx >= 0) {
          handleSelect(enabledOptions[focusedIdx].value);
        } else {
          setOpen(v => !v);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) { setOpen(true); setFocusedIdx(0); break; }
        setFocusedIdx(i => Math.min(i + 1, enabledOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIdx(i => Math.max(i - 1, 0));
        break;
      case "Escape":
        setOpen(false);
        setFocusedIdx(-1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <SelectContext.Provider value={{ value, onChange: handleSelect, open, setOpen, triggerId, listboxId }}>
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Trigger button */}
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => !disabled && setOpen(v => !v)}
          onKeyDown={handleKeyDown}
          className={cn(triggerVariants({ size, state }), triggerClassName)}
        >
          <span className={cn("flex items-center gap-2 truncate", !selected && "text-muted-foreground")}>
            {renderSelected
              ? renderSelected(selected)
              : selected
              ? (
                <>
                  {selected.icon && <span className="shrink-0">{selected.icon}</span>}
                  <span className="truncate">{selected.label}</span>
                </>
              )
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown menu */}
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            className={cn(
              "absolute z-50 mt-1 w-full min-w-[8rem] overflow-auto rounded-lg",
              "border border-border bg-card shadow-lg",
              "py-1 text-sm",
              "max-h-60 animate-in fade-in-0 zoom-in-95 duration-100",
              menuClassName
            )}
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-muted-foreground text-center text-xs">
                Không có lựa chọn
              </li>
            )}
            {options.map((opt, idx) => {
              const enabledIdx = enabledOptions.findIndex(o => o.value === opt.value);
              const isFocused = enabledIdx === focusedIdx;
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  onMouseEnter={() => !opt.disabled && setFocusedIdx(enabledIdx)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none",
                    "transition-colors",
                    isFocused && !opt.disabled && "bg-accent text-accent-foreground",
                    isSelected && "text-primary font-medium",
                    opt.disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0 text-muted-foreground">{opt.icon}</span>}
                    <span className="flex flex-col">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[11px] text-muted-foreground font-normal">{opt.description}</span>
                      )}
                    </span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SelectContext.Provider>
  );
}

// ─── 2. <NativeSelect> ────────────────────────────────────────────────────────
// Thin styled wrapper around <select> — works perfectly with react-hook-form
export interface NativeSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof triggerVariants> {
  options?: SelectOption[];
  placeholder?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    { options = [], placeholder, size = "md", state = "default", className, children, ...props },
    ref
  ) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            triggerVariants({ size, state }),
            // Override appearance for native select
            "appearance-none pr-8",
            // Restore text colour when value is empty (placeholder)
            !props.value && !props.defaultValue && "text-muted-foreground",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        {/* Custom chevron icon overlay */}
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";
