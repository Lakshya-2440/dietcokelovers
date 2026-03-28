import * as React from "react"
import { cn } from "../../lib/utils"
import { FileText } from "lucide-react"

export interface CitationProps extends React.HTMLAttributes<HTMLSpanElement> {
  number: number
  children?: React.ReactNode
  onClick?: () => void
}

export function Citation({ number, children, className, onClick, ...props }: CitationProps) {
  return (
    <span 
      className={cn(
        "group relative inline-flex cursor-pointer items-center transition-all",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Context text if provided */}
      {children && (
        <span className="marker-highlight inline-block">
          {children}
        </span>
      )}
      
      {/* Citation Bubble */}
      <sup 
        className="ml-0.5 inline-flex h-4 w-4 shrink-0 translate-y-[-0.25em] items-center justify-center rounded-full bg-charcoal/10 font-mono text-[9px] font-medium text-charcoal transition-colors group-hover:bg-charcoal group-hover:text-paleivory"
        title="View source"
      >
        {number}
      </sup>

      {/* Hover Tooltip/Preview */}
      <span className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 transform rounded-md bg-foreground p-2 text-xs text-background shadow-paper-deep group-hover:block z-50 pointer-events-none">
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-1 font-mono text-[10px] text-charcoal whitespace-nowrap">
            <FileText size={10} className="text-paleivory"/> Source {number}
          </span>
          <span className="opacity-90 leading-tight">Click to scroll to this exact highlight in your notes.</span>
        </span>
        {/* Triangle Arrow */}
        <span className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-charcoal"></span>
      </span>
    </span>
  )
}
