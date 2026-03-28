import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "neutral" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-charcoal text-paleivory shadow",
    success: "border-transparent bg-charcoal/10 text-charcoal",
    neutral: "border-transparent bg-charcoal/5 text-charcoal/80",
    outline: "text-charcoal border-charcoal/10",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }
