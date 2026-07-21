import * as React from "react"
import { Input, InputProps } from "./Input"

export const DateInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", onChange, onBlur, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState<string>(props.value as string || props.defaultValue as string || "");

    React.useEffect(() => {
      setLocalValue(props.value as string || "");
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      if (props.onFocus) props.onFocus(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      setLocalValue(val);
      if (onChange) onChange(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let val = e.target.value.trim();
      
      // Auto-format "7/20" to "2026-07-20"
      if (val.match(/^\d{1,2}[\/\-]\d{1,2}$/)) {
        const parts = val.split(/[\/\-]/);
        const currentYear = new Date().getFullYear();
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        val = `${currentYear}-${month}-${day}`;
        e.target.value = val;
        setLocalValue(val);
        if (onChange) {
          // Trigger change event with new value
          const event = Object.create(e);
          event.target = { ...e.target, value: val };
          onChange(event as React.ChangeEvent<HTMLInputElement>);
        }
      }

      if (onBlur) onBlur(e);
    };

    return (
      <Input
        type="date"
        className={className}
        ref={ref}
        {...props}
        value={localValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        max={props.max || "9999-12-31"}
      />
    )
  }
)
DateInput.displayName = "DateInput"
