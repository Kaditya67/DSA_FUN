"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

type SelectProps = {
  value?: string
  onValueChange?: (v: string) => void
  id?: string
  className?: string
  children?: React.ReactNode
}
type SelectItemProps = { value: string; children: React.ReactNode }

function flattenItems(nodes: React.ReactNode): SelectItemProps[] {
  const out: SelectItemProps[] = []
  React.Children.forEach(nodes as any, (child: any) => {
    if (!child) return
    if (child.type && (child.type as any).__selectItem) {
      out.push({ value: child.props.value, children: child.props.children })
      return
    }
    if (child.props && child.props.children) {
      out.push(...flattenItems(child.props.children))
    }
  })
  return out
}

export function Select({ value, onValueChange, id, className, children }: SelectProps) {
  const items = React.useMemo(() => flattenItems(children), [children])
  return (
    <select
      id={id}
      className={cn(
        "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600",
        className,
      )}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {typeof it.children === "string" ? it.children : it.value}
        </option>
      ))}
    </select>
  )
}

export function SelectTrigger(props: React.HTMLAttributes<HTMLDivElement>) {
  // placeholder shim for API compatibility (not used; native select renders)
  return <div {...props} />
}
export function SelectContent(props: React.HTMLAttributes<HTMLDivElement>) {
  // placeholder shim
  return <div {...props} />
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  // placeholder shim
  return <span className="sr-only">{placeholder}</span>
}
export function SelectItem({ children }: SelectItemProps) {
  // placeholder shim to allow flattenItems to find options
  return <>{children}</>
}
;(SelectItem as any).__selectItem = true
