import * as React from "react"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

import type { HTMLMotionProps } from "framer-motion"

export interface ChatBubbleProps extends HTMLMotionProps<"div"> {
  role: "user" | "assistant"
  children: React.ReactNode
  delay?: number
}

export function ChatBubble({ role, children, delay = 0, className, ...props }: ChatBubbleProps) {
  const isUser = role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed",
          isUser
            ? "bg-charcoal text-paleivory shadow-paper-hover rounded-tr-sm"
            : "bg-paleivory text-charcoal border border-charcoal/5 shadow-paper rounded-tl-sm glass-paper"
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}
