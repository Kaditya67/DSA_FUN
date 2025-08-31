import type * as React from "react"
import { cn } from "../../lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive"
  size?: "sm" | "md" | "lg" | "icon"
}

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400",
  outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
  destructive: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
}
const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-2 text-sm",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4",
  icon: "h-9 w-9",
}

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
