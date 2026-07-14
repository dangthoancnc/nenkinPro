import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      outline: "border border-input bg-background shadow-sm hover:bg-muted hover:text-foreground",
      ghost: "hover:bg-muted hover:text-foreground",
      danger: "bg-red-500 text-white shadow-sm hover:bg-red-600"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 py-2",
      lg: "h-10 px-8",
      icon: "h-9 w-9"
    }

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
